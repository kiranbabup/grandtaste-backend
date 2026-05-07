// userRoutes.js
import express from "express";
import {
  registerUser,
  loginWebsite,
  loginApp,
  loginCustomer,
  googleAuth,
  getUserProfile,
  updateUserProfile,
  addOrUpdateAddress,
  getUserAddresses,
  deleteAddress,
  forgotPassword,
  getUsersByRoleHierarchy,
  getUsersByReferralHierarchy,
  searchUsersByHierarchy,
  requestWithdraw,
  getMyEarningsHistory,
  getUserById
} from "../controllers/userController.js";
import { updateUserStatus, getAllWithdrawRequests, updateWithdrawStatus, getUserEarningsHistory, getPayments } from "../controllers/adminController.js";
import { sendNotification, getMyNotifications, markNotificationRead } from "../controllers/notificationController.js";
import {
  protect,
  websiteStaff,
  superAdminOnly,
  appStaffOnly,
} from "../middleware/authMiddleware.js";
import { deleteBankDetail, getUserBankDetails, storeBankDetails, updateBankDetails } from "../controllers/bankController.js";

const router = express.Router();

// PUBLIC AUTH ROUTES
router.post("/register", registerUser);

router.post("/loginWebsite", loginWebsite);
router.post("/loginApp", loginApp);
router.post("/loginCustomer", loginCustomer);

router.post("/google", googleAuth);

router.put("/forgotPassword", forgotPassword);

// PROFILE ROUTES (ALL ACTIVE USERS)
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// ADDRESS ROUTES
router.post("/address", protect, addOrUpdateAddress);
router.get("/addresses", protect, getUserAddresses);
router.delete("/address/:id", protect, deleteAddress);

// USER HIERARCHY ROUTES
router.get("/users/by-role/:role", protect, getUsersByRoleHierarchy);
router.get("/users/downline/:referalcode", protect, getUsersByReferralHierarchy);
router.get("/users/search/:searchString", protect, websiteStaff, searchUsersByHierarchy);
router.get("/users/:id", protect, getUserById);
router.put("/users/status/:id", protect, updateUserStatus);

// EARNINGS
router.get("/earnings/history", protect, getMyEarningsHistory);
router.get("/earnings/user/:userId", protect, getUserEarningsHistory);

// Bank Details
router.post("/bank-details", protect, appStaffOnly, storeBankDetails);
router.get("/bank-details", protect, appStaffOnly, getUserBankDetails);
router.put("/bank-details/:id", protect, appStaffOnly, updateBankDetails);
router.delete("/bank-details/:id", protect, appStaffOnly, deleteBankDetail);

// WITHDRAW
router.post("/withdraw/request", protect, appStaffOnly, requestWithdraw);
// WITHDRAW website only routes
router.get("/withdraw/all", protect, superAdminOnly, getAllWithdrawRequests);
router.put("/withdraw/status/:id", protect, superAdminOnly, updateWithdrawStatus);

// NOTIFICATIONS
router.post("/notifications/send", protect, sendNotification);
router.get("/notifications", protect, getMyNotifications);
router.put("/notifications/read/:id", protect, markNotificationRead);

router.get("/getpayments", protect, superAdminOnly, getPayments);

export default router;