import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import generateReferralCode from "../utils/generateReferralCode.js";
import { OAuth2Client } from 'google-auth-library';
import { Op } from "sequelize";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// REGISTER
export const registerUser = async (req, res) => {
  const { name, password, phone, referedby } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  if (!referedby) {
    return res.status(400).json({ message: "Referral code is required for registration" });
  }

  let phoneExists = await User.findOne({ where: { phone } });

  if (phoneExists) {
    return res.status(400).json({ message: "Phone number already exists" });
  }

  let expectedRole = "";

  // Validate referedby code and enforce strict hierarchy
  if (referedby === "superadmin") {
    expectedRole = "admin";
  } else {
    const referrer = await User.findOne({ where: { referalcode: referedby } });
    if (!referrer) {
      return res.status(400).json({ message: "Invalid referral code" });
    }

    if (referrer.role === "admin") {
      expectedRole = "supervisor";
    } else if (referrer.role === "supervisor") {
      expectedRole = "employee";
    } else if (referrer.role === "employee") {
      expectedRole = "customer";
    } else {
      // customer role or anything else
      return res.status(403).json({ message: "Customers cannot register new users" });
    }
  }

  // Customers do not get a referral code
  let referalcode = null;
  if (expectedRole !== "customer") {
    referalcode = generateReferralCode();
  }

  const user = await User.create({ 
    name, 
    password, 
    phone, 
    role: expectedRole, 
    referedby, 
    referalcode 
  });

  res.status(201).json({
    id: user.id,
    name: user.name,
    role: user.role,
    phone: user.phone,
    referedby: user.referedby,
    referalcode: user.referalcode,
    status: user.status,
    token: generateToken(user.id),
  });
};

// LOGIN
export const loginUser = async (req, res) => {
  const { phone, password } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  let user = await User.findOne({ where: { phone } });

  if (user && (await user.matchPassword(password))) {
    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      referalcode: user.referalcode,
      status: user.status,
      token: generateToken(user.id),
    });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
};

// GOOGLE AUTH
export const googleAuth = async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
    });
    const payload = ticket.getPayload();
    const { email } = payload;

    let user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Email not registered. Please login with phone and update email in your profile first." });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error) {
    // Try to get info from the google userinfo endpoint if it's an access token
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch user with access token");

      const payload = await response.json();
      const { email } = payload;

      let user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({ message: "Email not registered. Please login with phone and update email in your profile first." });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } catch (err) {
      console.error("Google Auth Error:", err);
      res.status(401).json({ message: "Invalid Google Token" });
    }
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (user) {
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      addresses: user.addresses,
      role: user.role,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      // Only update password if provided
      if (req.body.password) {
        user.password = req.body.password;
      }

      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;

      if (req.body.addresses) {
        if (req.body.addresses.length > 3) {
          return res.status(400).json({ message: "Cannot store more than 3 addresses" });
        }
        user.addresses = req.body.addresses;
      }

      const updatedUser = await user.save();

      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        addresses: updatedUser.addresses,
        role: updatedUser.role,
        token: generateToken(updatedUser.id),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: error.message || "Failed to update profile", error: error.toString() });
  }
};

// @desc    Get all users with pagination
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      totalItems: count,
      users: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

// @desc    Get users by role with pagination
// @route   GET /api/users/role/:role
// @access  Private/Admin
export const getUsersByRole = async (req, res) => {
  const role = req.params.role;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await User.findAndCountAll({
      where: { role },
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      totalItems: count,
      users: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users by role", error: error.message });
  }
};

// @desc    Get a user by referral code
// @route   GET /api/users/referral/:referalcode
// @access  Private
export const getUserByReferalCode = async (req, res) => {
  const referalcode = req.params.referalcode;

  try {
    const user = await User.findOne({
      where: { referalcode },
      attributes: { exclude: ['password'] }
    });

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user", error: error.message });
  }
};

// @desc    Get users referred by a specific referral code with pagination
// @route   GET /api/users/referredby/:referalcode
// @access  Private
export const getUsersByReferalCode = async (req, res) => {
  const referedby = req.params.referalcode;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await User.findAndCountAll({
      where: { referedby },
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      totalItems: count,
      users: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch referred users", error: error.message });
  }
};

// @desc    Update any user by ID (admin function or superadmin)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only update fields that are present in req.body
    const updatableFields = ['name', 'email', 'phone', 'role', 'status', 'addresses', 'password'];
    
    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    }

    const updatedUser = await user.save();

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      status: updatedUser.status,
      addresses: updatedUser.addresses,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update user", error: error.message });
  }
};

// @desc    Search users by name, email, or phone
// @route   GET /api/users/getUserbySearchByString/:searchString
// @access  Private/Admin
export const getUserbySearchByString = async (req, res) => {
  const searchString = req.params.searchString;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await User.findAndCountAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${searchString}%` } },
          { email: { [Op.like]: `%${searchString}%` } },
          { phone: { [Op.like]: `%${searchString}%` } }
        ]
      },
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      totalItems: count,
      users: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to search users", error: error.message });
  }
};