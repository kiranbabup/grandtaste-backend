import express from "express";
import { createOrder, getAllOrders, getMyOrders, getOrderById, getOrdersByEmployeePincode, getOrdersBySearchPhone } from "../controllers/orderController.js";
  // requestCancelOrder,
  // requestReturnOrder,

  // employeeUpdateOrderStatus,
  // supervisorUpdateOrderStatus,
  // adminUpdateOrderStatus,

  // userOrderEarning,

import {
  protect,
  websiteStaff,
  appStaffOnly,
  employeeOnly,
  customerOnly,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// CUSTOMER / APP USER ROUTES
router.post("/createOrder", protect, createOrder);

router.get("/myorders", protect, getMyOrders);

router.get("/getOrderById/:id", protect, getOrderById);

router.get("/userOrderEarning", protect, userOrderEarning);

// CUSTOMER STATUS REQUESTS
router.put(
  "/requestCancel/:id",
  protect,
  customerOnly,
  requestCancelOrder
);

router.put(
  "/requestReturn/:id",
  protect,
  customerOnly,
  requestReturnOrder
);

// EMPLOYEE ROUTES
router.get(
  "/employeeOrders",
  protect,
  employeeOnly,
  getOrdersByEmployeePincode
);

router.put(
  "/employeeUpdateStatus/:id",
  protect,
  employeeOnly,
  employeeUpdateOrderStatus
);

// SUPERVISOR ROUTES
router.put(
  "/supervisorUpdateStatus/:id",
  protect,
  websiteStaff,
  supervisorUpdateOrderStatus
);

// ADMIN / SUPERADMIN ROUTES
router.put(
  "/adminUpdateStatus/:id",
  protect,
  websiteStaff,
  adminUpdateOrderStatus
);

// WEBSITE STAFF VIEW ROUTES
router.get(
  "/getAllOrders",
  protect,
  websiteStaff,
  getAllOrders
);

router.get(
  "/searchByPhone/:phone",
  protect,
  websiteStaff,
  getOrdersBySearchPhone
);

export default router;