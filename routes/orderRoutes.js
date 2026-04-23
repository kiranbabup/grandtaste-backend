import express from "express";
import {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  getMyOrders,
  getOrderById,
} from "../controllers/orderController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createOrder); // User
router.get("/myorders", protect, getMyOrders); // User Route
router.get("/:id", protect, getOrderById); // Get order by ID
router.get("/", protect, admin, getAllOrders); // Admin
router.put("/:id/status", protect, admin, updateOrderStatus); // Admin

export default router;
