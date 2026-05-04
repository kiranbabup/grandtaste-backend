// userController.js
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import generateReferralCode from "../utils/generateReferralCode.js";
import { OAuth2Client } from 'google-auth-library';
import { Op } from "sequelize";
import Address from "../models/AddressModel.js";
import Withdraw from "../models/WithdrawModel.js";
import BankDetail from "../models/BankDetailsModel.js";
import EarningsLedger from "../models/EarningsLedgerModel.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      phone,
      password,
      referedby,
      pincode,
      address,
    } = req.body;

    // Required validations
    if (!name || !phone || !password || !referedby) {
      return res.status(400).json({
        message: "Name, phone, password, and referral code are required",
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Existing phone check
    const existingUser = await User.findOne({
      where: { phone },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Phone number already exists",
      });
    }

    let role = "";
    let parentUser = null;

    // SUPERADMIN → ADMIN
    if (referedby === "superadmin") {
      role = "admin";

      parentUser = await User.findOne({
        where: { referalcode: "superadmin" },
      });

      if (!parentUser) {
        return res.status(400).json({
          message: "Superadmin referral not found",
        });
      }

    } else {
      parentUser = await User.findOne({
        where: { referalcode: referedby },
      });

      if (!parentUser) {
        return res.status(400).json({
          message: "Invalid referral code",
        });
      }

      // Parent account must be active
      if (parentUser.status !== "active") {
        return res.status(403).json({
          message: "Referral user is not active",
        });
      }

      // Role hierarchy
      switch (parentUser.role) {
        case "admin":
          role = "supervisor";
          break;

        case "supervisor":
          role = "employee";
          break;

        case "employee":
          role = "customer";
          break;

        default:
          return res.status(403).json({
            message: "This user cannot refer new registrations",
          });
      }
    }

    // Mandatory pincode validation
    if (
      ["employee", "customer"].includes(role) &&
      !pincode
    ) {
      return res.status(400).json({
        message: `${role} registration requires pincode`,
      });
    }

    // Unique referral code generation
    let referalcode = null;

    if (role !== "customer") {
      let isUnique = false;

      while (!isUnique) {
        const generatedCode = generateReferralCode();

        const existingCode = await User.findOne({
          where: { referalcode: generatedCode },
        });

        if (!existingCode) {
          referalcode = generatedCode;
          isUnique = true;
        }
      }
    }

    // Create user
    const user = await User.create({
      name,
      phone,
      password,
      referedby,
      referalcode,
      role,
      pincode: pincode || null,
      parentId: parentUser ? parentUser.id : null,
    });

    // Increment parent direct referrals
    if (parentUser) {
      parentUser.directReferrals += 1;
      await parentUser.save();
    }

    // Optional address creation
    if (address) {
      await Address.create({
        userId: user.id,
        addressType: address.addressType || "home",
        name: address.name || name,
        phone: address.phone || phone,
        h_no: address.h_no,
        street: address.street,
        landmark: address.landmark || "",
        city: address.city,
        state: address.state,
        pincode: address.pincode || pincode,
        isDefault: true,
      });
    }

    // Success response with auto-login
    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email || "",
      phone: user.phone,
      role: user.role,
      pincode: user.pincode || "",
      referalcode: user.referalcode || "",
      referedby: user.referedby,
      earnings: user.earnings || 0,
      directReferrals: user.directReferrals || 0,
      status: user.status,
      token: generateToken(user.id),
    });

  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

// LOGIN web
export const loginWebsite = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        message: "Phone and password are required",
      });
    }

    const user = await User.findOne({ where: { phone } });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // STATUS CHECK
    if (user.status !== "active") {
      return res.status(403).json({
        message: `Account is ${user.status}. Please contact support.`,
      });
    }

    if (!["superadmin", "admin", "supervisor"].includes(user.role)) {
      return res.status(403).json({
        message: "Access denied for website login",
      });
    }

    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      referalcode: user.referalcode,
      status: user.status,
      token: generateToken(user.id),
    });

  } catch (error) {
    res.status(500).json({
      message: "Website login failed",
      error: error.message,
    });
  }
};

// login app staff
export const loginApp = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        message: "Phone and password are required",
      });
    }

    const user = await User.findOne({ where: { phone } });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // STATUS CHECK
    if (user.status !== "active") {
      return res.status(403).json({
        message: `Account is ${user.status}. Please contact support.`,
      });
    }

    if (!["admin", "supervisor", "employee"].includes(user.role)) {
      return res.status(403).json({
        message: "Access denied for app login",
      });
    }

    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      referalcode: user.referalcode,
      status: user.status,
      token: generateToken(user.id),
    });

  } catch (error) {
    res.status(500).json({
      message: "App login failed",
      error: error.message,
    });
  }
};

// login customer
export const loginCustomer = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }

    const user = await User.findOne({
      where: {
        phone,
        role: "customer",
      },
    });

    if (!user) {
      return res.status(404).json({
        existingUser: false,
        message: "User not found. Please register.",
      });
    }

    // STATUS CHECK
    if (user.status !== "active") {
      return res.status(403).json({
        existingUser: true,
        message: `Account is ${user.status}. Please contact support.`,
      });
    }

    res.json({
      existingUser: true,
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      token: generateToken(user.id),
    });

  } catch (error) {
    res.status(500).json({
      message: "Customer login failed",
      error: error.message,
    });
  }
};

// GOOGLE AUTH
export const googleAuth = async (req, res) => {
  const { token } = req.body;

  try {
    let email = null;

    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      email = payload.email;

    } catch {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Invalid Google token");
      }

      const payload = await response.json();
      email = payload.email;
    }

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message:
          "Email not registered. Please login with phone and update email first.",
      });
    }

    // STATUS CHECK
    if (user.status !== "active") {
      return res.status(403).json({
        message: `Account is ${user.status}. Please contact support.`,
      });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      referalcode: user.referalcode,
      status: user.status,
      token: generateToken(user.id),
    });

  } catch (error) {
    console.error("Google Auth Error:", error);

    res.status(401).json({
      message: "Invalid Google Token",
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Get referrer name
    let referredByName = "";

    if (user.parentId) {
      const parentUser = await User.findByPk(user.parentId);
      referredByName = parentUser ? parentUser.name : "";
    }

    // Get addresses
    const addresses = await Address.findAll({
      where: { userId: user.id },
      order: [["isDefault", "DESC"]],
    });

    return res.json({
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "",
      pincode: user.pincode || "",
      referedby: referredByName || "",
      referalcode: user.referalcode || "",
      earnings:
        ["admin", "supervisor", "employee"].includes(user.role)
          ? user.earnings
          : 0,
      directReferrals:
        ["admin", "supervisor", "employee"].includes(user.role)
          ? user.directReferrals
          : 0,
      details: user.details || {},
      addresses,
      createdAt: user.createdAt,
    });

  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Only allow updating name + email
    if (name !== undefined) {
      user.name = name;
    }

    if (email !== undefined) {
      user.email = email;
    }

    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "",
        pincode: user.pincode || "",
        referalcode: user.referalcode || "",
        earnings:
          ["admin", "supervisor", "employee"].includes(user.role)
            ? user.earnings
            : 0,
        directReferrals:
          ["admin", "supervisor", "employee"].includes(user.role)
            ? user.directReferrals
            : 0,
        details: user.details || {},
      },
      token: generateToken(user.id),
    });

  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
};


// # ADD / UPDATE ADDRESS API
export const addOrUpdateAddress = async (req, res) => {
  try {
    const {
      id,
      addressType,
      name,
      phone,
      h_no,
      street,
      landmark,
      city,
      state,
      pincode,
      isDefault,
    } = req.body;

    if (!name || !phone || !h_no || !street || !city || !state || !pincode) {
      return res.status(400).json({
        message: "All required address fields must be provided",
      });
    }

    let address;

    // If setting default, unset previous defaults
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
    }

    // UPDATE existing address
    if (id) {
      address = await Address.findOne({
        where: {
          id,
          userId: req.user.id,
        },
      });

      if (!address) {
        return res.status(404).json({
          message: "Address not found",
        });
      }

      await address.update({
        addressType: addressType || address.addressType,
        name,
        phone,
        h_no,
        street,
        landmark,
        city,
        state,
        pincode,
        isDefault: isDefault || false,
      });

    } else {
      // ADD new address
      address = await Address.create({
        userId: req.user.id,
        addressType: addressType || "home",
        name,
        phone,
        h_no,
        street,
        landmark,
        city,
        state,
        pincode,
        isDefault: isDefault || false,
      });
    }

    return res.status(200).json({
      message: id
        ? "Address updated successfully"
        : "Address added successfully",
      address,
    });

  } catch (error) {
    console.error("Address Save Error:", error);

    return res.status(500).json({
      message: "Failed to save address",
      error: error.message,
    });
  }
};

// # GET USER ADDRESSES
export const getUserAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { userId: req.user.id },
      order: [["isDefault", "DESC"]],
    });

    return res.json(addresses);

  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch addresses",
      error: error.message,
    });
  }
};

// # DELETE ADDRESS
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    await address.destroy();

    return res.json({
      message: "Address deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete address",
      error: error.message,
    });
  }
};

// forgotpassword
export const forgotPassword = async (req, res) => {
  try {
    const { phone, newPassword } = req.body;

    // Required validation
    if (!phone || !newPassword) {
      return res.status(400).json({
        message: "Phone number and new password are required",
      });
    }

    // Optional password strength validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Find user by phone
    const user = await User.findOne({
      where: { phone },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Status validation BEFORE password reset
    if (user.status !== "active") {
      return res.status(403).json({
        message: `Account is ${user.status}. Password reset denied.`,
      });
    }

    // Customers cannot use forgot password
    if (user.role === "customer") {
      return res.status(403).json({
        message: "Customers cannot use forgot password",
      });
    }

    // Update password
    user.password = newPassword;

    // Sequelize hook auto-hashes
    await user.save();

    return res.status(200).json({
      message: "Password updated successfully",
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      message: "Failed to update password",
      error: error.message,
    });
  }
};

// GET USERS BY ROLE
export const getUsersByRoleHierarchy = async (req, res) => {
  try {
    const { role } = req.params;
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    if (
      !["superadmin", "admin", "supervisor", "employee"].includes(
        loggedInUser.role
      )
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    let whereClause = { role };

    // SUPERADMIN
    if (loggedInUser.role === "superadmin") {
      whereClause = { role };
    }

    // ADMIN
    else if (loggedInUser.role === "admin") {
      if (!["supervisor", "employee", "customer"].includes(role)) {
        return res.status(403).json({
          message: "Admins cannot access this role",
        });
      }

      // Get all supervisors referred by this admin
      const supervisors = await User.findAll({
        where: { referedby: loggedInUser.referalcode },
        attributes: ["referalcode"],
      });
      const supervisorCodes = supervisors.map((s) => s.referalcode);

      if (role === "supervisor") {
        whereClause = {
          role,
          referedby: loggedInUser.referalcode,
        };
      } else if (role === "employee") {
        whereClause = {
          role,
          [Op.or]: [
            { referedby: loggedInUser.referalcode },
            { referedby: { [Op.in]: supervisorCodes } },
          ],
        };
      } else if (role === "customer") {
        const employees = await User.findAll({
          where: {
            [Op.or]: [
              { referedby: loggedInUser.referalcode },
              { referedby: { [Op.in]: supervisorCodes } },
            ],
          },
          attributes: ["referalcode"],
        });
        const employeeCodes = employees.map((e) => e.referalcode);

        whereClause = {
          role,
          [Op.or]: [
            { referedby: loggedInUser.referalcode },
            { referedby: { [Op.in]: supervisorCodes } },
            { referedby: { [Op.in]: employeeCodes } },
          ],
        };
      }
    }

    // SUPERVISOR
    else if (loggedInUser.role === "supervisor") {
      if (!["employee", "customer"].includes(role)) {
        return res.status(403).json({
          message: "Supervisors can only access employees and customers",
        });
      }

      if (role === "employee") {
        whereClause = {
          role,
          referedby: loggedInUser.referalcode,
        };
      } else if (role === "customer") {
        const employees = await User.findAll({
          where: { referedby: loggedInUser.referalcode },
          attributes: ["referalcode"],
        });
        const employeeCodes = employees.map((e) => e.referalcode);

        whereClause = {
          role,
          [Op.or]: [
            { referedby: loggedInUser.referalcode },
            { referedby: { [Op.in]: employeeCodes } },
          ],
        };
      }
    }

    // EMPLOYEE
    else if (loggedInUser.role === "employee") {
      if (role !== "customer") {
        return res.status(403).json({
          message: "Employees can only view customers",
        });
      }

      whereClause = {
        role: "customer",
        referedby: loggedInUser.referalcode,
      };
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["password"] },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const formattedUsers = await Promise.all(
      rows.map(async (user) => {
        let parentName = "";

        if (user.parentId) {
          const parent = await User.findByPk(user.parentId);
          parentName = parent ? parent.name : "";
        }

        return {
          id: user.id,
          name: user.name || "",
          email: user.email || "",
          role: user.role || "",
          phone: user.phone || "",
          pincode: user.pincode || "",
          referedbyname: parentName,
          referalcode: user.referalcode || "",
          status: user.status || "",
          directReferrals: user.directReferrals || 0,
          details: user.details || {},
        };
      })
    );

    return res.json({
      totalItems: count,
      users: formattedUsers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });

  } catch (error) {
    console.error("Get Users By Role Error:", error);

    return res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// GET DOWNLINE USERS BY REFERRAL CODE
export const getUsersByReferralHierarchy = async (req, res) => {
  try {
    const { referalcode } = req.params;
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    if (
      !["superadmin", "admin", "supervisor", "employee"].includes(
        loggedInUser.role
      )
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // Verify referral code exists
    const validUser = await User.findOne({
      where: { referalcode },
    });

    if (!validUser) {
      return res.status(404).json({
        message: "Referral code not found",
      });
    }

    // EMPLOYEE restriction
    if (
      loggedInUser.role === "employee" &&
      referalcode !== loggedInUser.referalcode
    ) {
      return res.status(403).json({
        message: "Employees can only view their own downline",
      });
    }

    const { count, rows } = await User.findAndCountAll({
      where: {
        referedby: referalcode,
      },
      attributes: { exclude: ["password"] },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const formattedUsers = await Promise.all(
      rows.map(async (user) => {
        let parentName = "";

        if (user.parentId) {
          const parent = await User.findByPk(user.parentId);
          parentName = parent ? parent.name : "";
        }

        return {
          id: user.id,
          name: user.name || "",
          email: user.email || "",
          role: user.role || "",
          phone: user.phone || "",
          pincode: user.pincode || "",
          referedbyname: parentName,
          referalcode: user.referalcode || "",
          status: user.status || "",
          directReferrals: user.directReferrals || 0,
          details: user.details || {},
        };
      })
    );

    return res.json({
      totalItems: count,
      users: formattedUsers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });

  } catch (error) {
    console.error("Get Downline Users Error:", error);

    return res.status(500).json({
      message: "Failed to fetch downline users",
      error: error.message,
    });
  }
};

export const searchUsersByHierarchy = async (req, res) => {
  try {
    const { searchString } = req.params;
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    if (!["superadmin", "admin", "supervisor"].includes(loggedInUser.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    let whereClause = {
      [Op.or]: [
        { name: { [Op.like]: `%${searchString}%` } },
        { email: { [Op.like]: `%${searchString}%` } },
        { phone: { [Op.like]: `%${searchString}%` } },
        { referalcode: { [Op.like]: `%${searchString}%` } },
      ],
    };

    // ADMIN SEARCH RESTRICTION
    if (loggedInUser.role === "admin") {
      const supervisors = await User.findAll({
        where: { referedby: loggedInUser.referalcode },
        attributes: ["id", "referalcode"],
      });

      const supervisorCodes = supervisors.map((s) => s.referalcode);

      const employees = await User.findAll({
        where: {
          referedby: {
            [Op.in]: supervisorCodes,
          },
        },
        attributes: ["id", "referalcode"],
      });

      const employeeCodes = employees.map((e) => e.referalcode);

      whereClause = {
        ...whereClause,
        [Op.or]: [
          { referedby: loggedInUser.referalcode },
          { referedby: { [Op.in]: supervisorCodes } },
          { referedby: { [Op.in]: employeeCodes } },
        ],
      };
    }

    // SUPERVISOR SEARCH RESTRICTION
    if (loggedInUser.role === "supervisor") {
      const employees = await User.findAll({
        where: { referedby: loggedInUser.referalcode },
        attributes: ["id", "referalcode"],
      });

      const employeeCodes = employees.map((e) => e.referalcode);

      whereClause = {
        ...whereClause,
        [Op.or]: [
          { referedby: loggedInUser.referalcode },
          { referedby: { [Op.in]: employeeCodes } },
        ],
      };
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["password"] },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const formattedUsers = await Promise.all(
      rows.map(async (user) => {
        let parentName = "";

        if (user.parentId) {
          const parent = await User.findByPk(user.parentId);
          parentName = parent ? parent.name : "";
        }

        return {
          id: user.id,
          name: user.name || "",
          email: user.email || "",
          role: user.role || "",
          phone: user.phone || "",
          pincode: user.pincode || "",
          referedbyname: parentName,
          referalcode: user.referalcode || "",
          status: user.status || "",
          directReferrals: user.directReferrals || 0,
          details: user.details || {},
        };
      })
    );

    return res.json({
      totalItems: count,
      users: formattedUsers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });

  } catch (error) {
    console.error("Search Users Error:", error);

    return res.status(500).json({
      message: "Failed to search users",
      error: error.message,
    });
  }
};

// REQUEST WITHDRAW API
// admin / supervisor / employee only
export const requestWithdraw = async (req, res) => {
  try {
    const {
      withdrawAmount,
      bankDetailId,
      ac_holder_name,
      ac_no,
      ifsc_code,
      branch_name,
      upi,
      payment_mode,
    } = req.body;

    const user = req.user;

    // Role validation
    if (!["admin", "supervisor", "employee"].includes(user.role)) {
      return res.status(403).json({
        message: "Only Admin, Supervisor, or Employee can withdraw",
      });
    }

    // Amount validation
    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({
        message: "Valid withdraw amount required",
      });
    }

    // Minimum withdrawal limit
    if (parseFloat(withdrawAmount) < 100) {
      return res.status(400).json({
        message: "Minimum withdrawal amount is ₹100",
      });
    }

    // Active account validation
    if (user.status !== "active") {
      return res.status(403).json({
        message: `Account is ${user.status}. Withdrawal denied.`,
      });
    }

    // Prevent multiple pending requests
    const existingPendingRequest = await Withdraw.findOne({
      where: {
        userId: user.id,
        status: ["pending", "inprogress"],
      },
    });

    if (existingPendingRequest) {
      return res.status(400).json({
        message:
          "You already have a pending withdrawal request. Please wait until it is processed.",
      });
    }

    // Available balance check
    const availableBalance =
      parseFloat(user.earnings || 0) -
      parseFloat(user.withdrawn || 0);

    if (parseFloat(withdrawAmount) > availableBalance) {
      return res.status(400).json({
        message: "Insufficient withdrawable balance",
      });
    }

    let withdrawData = {
      userId: user.id,
      withdrawAmount,
      status: "pending",
    };

    // OPTION 1: Use saved bank detail
    if (bankDetailId) {
      const savedBank = await BankDetail.findOne({
        where: {
          id: bankDetailId,
          userId: user.id,
        },
      });

      if (!savedBank) {
        return res.status(404).json({
          message: "Selected bank detail not found",
        });
      }

      withdrawData = {
        ...withdrawData,
        ac_no: savedBank.ac_no,
        ifsc_code: savedBank.ifsc_code,
        branch_name: savedBank.branch_name,
        ac_holder_name: savedBank.ac_holder_name,
        upi: savedBank.upi,
        payment_mode: savedBank.upi ? "upi" : "bank_transfer",
      };
    }

    // OPTION 2: Manual entry
    else {
      if (!ac_holder_name) {
        return res.status(400).json({
          message: "Account holder name is required",
        });
      }

      if (!ac_no && !upi) {
        return res.status(400).json({
          message:
            "Either bank account details or UPI details are required",
        });
      }

      withdrawData = {
        ...withdrawData,
        ac_no: ac_no || null,
        ifsc_code: ifsc_code || null,
        branch_name: branch_name || null,
        ac_holder_name,
        upi: upi || null,
        payment_mode:
          payment_mode ||
          (upi ? "upi" : "bank_transfer"),
      };
    }

    // Create withdraw request
    const withdrawRequest = await Withdraw.create(withdrawData);

    return res.status(201).json({
      message: "Withdraw request submitted successfully",
      availableBalanceAfterRequest:
        availableBalance - parseFloat(withdrawAmount),
      withdrawRequest,
    });

  } catch (error) {
    console.error("Withdraw Request Error:", error);

    return res.status(500).json({
      message: "Failed to request withdrawal",
      error: error.message,
    });
  }
};

export const getMyEarningsHistory = async (req, res) => {
  try {
    const earnings = await EarningsLedger.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });

    return res.json(earnings);

  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch earnings history",
      error: error.message,
    });
  }
};

// GET USER BY ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Get referrer name
    let referredByName = "";
    if (user.parentId) {
      const parentUser = await User.findByPk(user.parentId);
      referredByName = parentUser ? parentUser.name : "";
    }

    // Get addresses
    const addresses = await Address.findAll({
      where: { userId: user.id },
      order: [["isDefault", "DESC"]],
    });

    return res.json({
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "",
      pincode: user.pincode || "",
      referedby: referredByName || "",
      referalcode: user.referalcode || "",
      earnings: user.earnings || 0.00,
      directReferrals: user.directReferrals || 0,
      addresses,
      status: user.status,
      createdAt: user.createdAt,
    });

  } catch (error) {
    console.error("Get User By ID Error:", error);

    return res.status(500).json({
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

