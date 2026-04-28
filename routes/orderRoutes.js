import express from "express";
import {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  getMyOrders,
  getOrderById,
  userOrderEarning,
} from "../controllers/orderController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/getAllOrders", protect, getAllOrders); // Role-based scoping handled in controller
router.put("/updateOrderStatus/:id", protect, updateOrderStatus); // Role-based access handled in controller

router.post("/createOrder", protect, createOrder); // User
router.get("/myorders", protect, getMyOrders); // User Route
router.get("/userOrderEarning", protect, userOrderEarning); // User Earnings Route

router.get("/getOrderById/:id", protect, getOrderById); // Get order by ID

export default router;
