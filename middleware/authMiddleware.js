// authMiddleware.js

import jwt from "jsonwebtoken";
import User from "../models/User.js";

// PROTECT ALL AUTHENTICATED USERS
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });

      if (!req.user) {
        return res.status(401).json({
          message: "User not found or deleted",
        });
      }

      // STATUS VALIDATION
      if (req.user.status !== "active") {
        return res.status(403).json({
          message: `Account is ${req.user.status}. Access denied.`,
        });
      }

      return next();

    } catch (error) {
      console.error("JWT Verification Error:", error.message);

      return res.status(401).json({
        message: "Not authorized, token failed",
      });
    }
  }

  return res.status(401).json({
    message: "No token, authorization denied",
  });
};


// SUPERADMIN ONLY
export const superAdminOnly = (req, res, next) => {
  if (req.user?.role === "superadmin") {
    return next();
  }
  return res.status(403).json({
    message: "SuperAdmin only",
  });
};


// WEBSITE STAFF
// superadmin + admin + supervisor
export const websiteStaff = (req, res, next) => {
  if (
    req.user &&
    ["superadmin", "admin", "supervisor"].includes(req.user.role)
  ) {
    return next();
  }
  return res.status(403).json({
    message: "Website staff only",
  });
};


// APP STAFF
// admin + supervisor + employee
export const appStaffOnly = (req, res, next) => {
  if (
    req.user &&
    ["admin", "supervisor", "employee"].includes(req.user.role)
  ) {
    return next();
  }
  return res.status(403).json({
    message: "App staff only",
  });
};


// CUSTOMER ONLY
export const customerOnly = (req, res, next) => {
  if (req.user?.role === "customer") {
    return next();
  }
  return res.status(403).json({
    message: "Customer only",
  });
};


// ADMIN CONTROL
// superadmin + admin
export const adminOnly = (req, res, next) => {
  if (
    req.user &&
    ["superadmin", "admin"].includes(req.user.role)
  ) {
    return next();
  }
  return res.status(403).json({
    message: "Admin or SuperAdmin only",
  });
};


// SUPERVISOR+
export const supervisorAccess = (req, res, next) => {
  if (
    req.user &&
    ["superadmin", "admin", "supervisor"].includes(req.user.role)
  ) {
    return next();
  }
  return res.status(403).json({
    message: "Supervisor/Admin/SuperAdmin only",
  });
};