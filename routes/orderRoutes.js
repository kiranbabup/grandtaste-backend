import express from "express";
import { adminUpdateOrderStatus, createOrder, employeeUpdateDeliveryStatus, employeeUpdateOrderStatus, getAllOrders, getMyOrders, getOrderById, getOrdersByEmployeePincode, getOrdersBySearchPhone, requestCancelOrder, requestReturnOrder, supervisorUpdateOrderStatus } from "../controllers/orderController.js";

import {
  protect,
  websiteStaff,
  employeeOnly,
  customerOnly,
  superAdminOnly,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// CUSTOMER / APP USER ROUTES
router.post("/createOrder", protect, createOrder);
router.get("/myorders", protect, getMyOrders);
router.get("/getOrderById/:id", protect, getOrderById);

// router.get("/userOrderEarning", protect, userOrderEarning);

// CUSTOMER STATUS REQUESTS
router.put("/requestCancel/:id", protect, customerOnly, requestCancelOrder);
router.put("/requestReturn/:id", protect, customerOnly, requestReturnOrder);

// EMPLOYEE ROUTES
router.get("/employeeOrders", protect, employeeOnly, getOrdersByEmployeePincode);
router.put("/employeeUpdateStatus/:id", protect, employeeOnly, employeeUpdateOrderStatus);
router.put("/employeeUpdateDeliveryStatus/:id", protect, employeeOnly, employeeUpdateDeliveryStatus);

// SUPERVISOR / ADMIN / SUPERADMIN ROUTES
router.put("/supervisorUpdateStatus/:id", protect, websiteStaff, supervisorUpdateOrderStatus);

// SUPERADMIN ROUTES
router.put("/adminUpdateStatus/:id", protect, superAdminOnly, adminUpdateOrderStatus);

// WEBSITE STAFF VIEW ROUTES
router.get("/getAllOrders", protect, websiteStaff, getAllOrders);
router.get("/searchByPhone/:phone", protect, websiteStaff, getOrdersBySearchPhone);

export default router;