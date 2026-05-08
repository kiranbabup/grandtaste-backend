import express from "express";
import {
  getDashboardRoleCounts,
  getIncomeTrends,
  getOrderStatusCounts, 
  getSalesReport, 
  getStockProductCounts,
  getSuperAdminIncomeStats
} from "../controllers/adminController.js";
import { protect, superAdminOnly, websiteStaff } from "../middleware/authMiddleware.js";

const router = express.Router();

// DASHBOARD
router.get("/dashboard/role-counts", protect, websiteStaff, getDashboardRoleCounts);
router.get("/dashboard/sales", protect, superAdminOnly, getSalesReport);
router.get("/dashboard/income-trends", protect, superAdminOnly, getIncomeTrends);
router.get("/dashboard/order-counts", protect, websiteStaff, getOrderStatusCounts);
router.get("/dashboard/stock-products", protect, websiteStaff, getStockProductCounts);
router.get("/dashboard/superadmin-income-stats", protect, superAdminOnly, getSuperAdminIncomeStats);

export default router;