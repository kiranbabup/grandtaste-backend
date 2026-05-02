// adminController.js
import EarningsLedger from "../models/EarningsLedgerModel.js";
import User from "../models/User.js";
import Withdraw from "../models/WithdrawModel.js";
import Payments from "../models/payments_model.js";

// ROLE ACCESS CONTROL
const canManageRole = (loggedInRole, targetRole) => {
  const permissions = {
    superadmin: ["admin", "supervisor", "employee", "customer"],
    admin: ["supervisor", "employee", "customer"],
    supervisor: ["employee", "customer"],
  };

  return permissions[loggedInRole]?.includes(targetRole);
};

// UPDATE USER STATUS
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const loggedInUser = req.user;

    if (!["active", "inactive", "blocked"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
      });
    }

    const targetUser = await User.findByPk(id);

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (
      loggedInUser.role !== "superadmin" &&
      !canManageRole(loggedInUser.role, targetUser.role)
    ) {
      return res.status(403).json({
        message: "You cannot manage this user",
      });
    }

    targetUser.status = status;
    await targetUser.save();

    return res.json({
      message: "User status updated successfully",
      userId: targetUser.id,
      newStatus: targetUser.status,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to update user status",
      error: error.message,
    });
  }
};

// SUPERADMIN VIEW ALL WITHDRAW REQUESTS
export const getAllWithdrawRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Withdraw.findAndCountAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "name",
            "phone",
            "role",
            "earnings",
            "withdrawn",
            "status",
            "referalcode",
          ],
        },
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      totalItems: count,
      withdrawRequests: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });

  } catch (error) {
    console.error("Get Withdraw Requests Error:", error);

    return res.status(500).json({
      message: "Failed to fetch withdraw requests",
      error: error.message,
    });
  }
};

// SUPERADMIN UPDATE WITHDRAW STATUS
export const updateWithdrawStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      payment_transaction_ID,
      payment_mode,
    } = req.body;

    const validStatuses = [
      "pending",
      "inprogress",
      "sent",
      "failed",
      "rejected",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid withdraw status",
      });
    }

    const withdraw = await Withdraw.findByPk(id);

    if (!withdraw) {
      return res.status(404).json({
        message: "Withdraw request not found",
      });
    }

    const user = await User.findByPk(withdraw.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Prevent modifying completed requests
    if (["sent", "failed", "rejected"].includes(withdraw.status)) {
      return res.status(400).json({
        message: "Withdraw request already finalized",
      });
    }

    // =========================
    // PENDING -> INPROGRESS
    // =========================
    if (withdraw.status === "pending" && status === "inprogress") {
      withdraw.status = "inprogress";
      withdraw.updatedAt = new Date().toISOString();

      await withdraw.save();

      return res.json({
        message: "Withdraw moved to inprogress",
        withdraw,
      });
    }

    // =========================
    // INPROGRESS -> SENT
    // =========================
    if (withdraw.status === "inprogress" && status === "sent") {
      if (!payment_transaction_ID || !payment_mode) {
        return res.status(400).json({
          message:
            "payment_transaction_ID and payment_mode are required for sent status",
        });
      }

      withdraw.status = "sent";
      withdraw.payment_transaction_ID = payment_transaction_ID;
      withdraw.payment_mode = payment_mode;
      withdraw.updatedAt = new Date().toISOString();

      await withdraw.save();

      // Deduct from withdrawable balance permanently
      user.withdrawn =
        parseFloat(user.withdrawn || 0) +
        parseFloat(withdraw.withdrawAmount);

      await user.save();

      return res.json({
        message: "Withdraw marked as sent successfully",
        withdraw,
      });
    }

    // =========================
    // INPROGRESS -> FAILED / REJECTED
    // =========================
    if (
      withdraw.status === "inprogress" &&
      ["failed", "rejected"].includes(status)
    ) {
      withdraw.status = status;
      withdraw.updatedAt = new Date().toISOString();

      await withdraw.save();

      // Return amount back to earnings
      user.earnings =
        parseFloat(user.earnings || 0) +
        parseFloat(withdraw.withdrawAmount);

      await user.save();

      return res.json({
        message: `Withdraw marked as ${status} and amount refunded`,
        withdraw,
      });
    }

    return res.status(400).json({
      message: `Invalid status transition from ${withdraw.status} to ${status}`,
    });

  } catch (error) {
    console.error("Withdraw Status Update Error:", error);

    return res.status(500).json({
      message: "Failed to update withdraw status",
      error: error.message,
    });
  }
};

export const getDashboardRoleCounts = async (req, res) => {
  try {
    const loggedInUser = req.user;

    if (!["superadmin", "admin", "supervisor"].includes(loggedInUser.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    let counts = {
      totalAdminsCount: 0,
      totalSupervisorsCount: 0,
      totalEmployeesCount: 0,
      totalCustomersCount: 0,
    };

    // SUPERADMIN → Full platform
    if (loggedInUser.role === "superadmin") {
      counts.totalAdminsCount = await User.count({
        where: { role: "admin" },
      });

      counts.totalSupervisorsCount = await User.count({
        where: { role: "supervisor" },
      });

      counts.totalEmployeesCount = await User.count({
        where: { role: "employee" },
      });

      counts.totalCustomersCount = await User.count({
        where: { role: "customer" },
      });
    }

    // ADMIN → Own downline
    if (loggedInUser.role === "admin") {
      const supervisors = await User.findAll({
        where: {
          role: "supervisor",
          referedby: loggedInUser.referalcode,
        },
        attributes: ["id", "referalcode"],
      });

      const supervisorCodes = supervisors
        .map((s) => s.referalcode)
        .filter(Boolean);

      const employees = await User.findAll({
        where: {
          role: "employee",
          referedby: {
            [Op.in]: supervisorCodes,
          },
        },
        attributes: ["id", "referalcode"],
      });

      const employeeCodes = employees
        .map((e) => e.referalcode)
        .filter(Boolean);

      const customersCount = await User.count({
        where: {
          role: "customer",
          referedby: {
            [Op.in]: employeeCodes,
          },
        },
      });

      counts.totalAdminsCount = 0;
      counts.totalSupervisorsCount = supervisors.length;
      counts.totalEmployeesCount = employees.length;
      counts.totalCustomersCount = customersCount;
    }

    // SUPERVISOR → Own downline
    if (loggedInUser.role === "supervisor") {
      const employees = await User.findAll({
        where: {
          role: "employee",
          referedby: loggedInUser.referalcode,
        },
        attributes: ["id", "referalcode"],
      });

      const employeeCodes = employees
        .map((e) => e.referalcode)
        .filter(Boolean);

      const customersCount = await User.count({
        where: {
          role: "customer",
          referedby: {
            [Op.in]: employeeCodes,
          },
        },
      });

      counts.totalAdminsCount = 0;
      counts.totalSupervisorsCount = 0;
      counts.totalEmployeesCount = employees.length;
      counts.totalCustomersCount = customersCount;
    }

    return res.json({
      success: true,
      role: loggedInUser.role,
      counts,
    });

  } catch (error) {
    console.error("Dashboard Role Counts Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard counts",
      error: error.message,
    });
  }
};

export const getUserEarningsHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await EarningsLedger.findAndCountAll({
      where: {
        userId,
      },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      totalItems: count,
      earningsHistory: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });

  } catch (error) {
    console.error("Get User Earnings History Error:", error);

    return res.status(500).json({
      message: "Failed to fetch user earnings history",
      error: error.message,
    });
  }
};

// SUPERADMIN GET ALL PAYMENTS WITH PAGINATION
export const getPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Payments.findAndCountAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "name",
            "phone",
            "role",
            "status",
            "referalcode",
          ],
        },
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      totalItems: count,
      payments: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });

  } catch (error) {
    console.error("Get Payments Error:", error);

    return res.status(500).json({
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};