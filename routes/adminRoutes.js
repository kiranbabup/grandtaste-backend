import express from "express";
import {
    getDashboardRoleCounts,
    getIncomeTrends,
    getOrderStatusCounts,
    getSalesReport,
    getStockProductCounts
} from "../controllers/adminController.js";
import { protect, superAdminOnly, websiteStaff } from "../middleware/authMiddleware.js";

const router = express.Router();

// DASHBOARD
router.get("/dashboard/role-counts", protect, websiteStaff, getDashboardRoleCounts);
router.get("/dashboard/sales", protect, superAdminOnly, getSalesReport);
router.get("/dashboard/income-trends", protect, superAdminOnly, getIncomeTrends);
router.get("/dashboard/order-counts", protect, websiteStaff, getOrderStatusCounts);
router.get("/dashboard/stock-products", protect, websiteStaff, getStockProductCounts);

export default router;