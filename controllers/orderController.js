import { Op } from "sequelize";
import { Order, OrderItem } from "../models/Order.js";
import { Cart, CartItem } from "../models/Cart.js";
import User from "../models/User.js";
import EarningsLedger from "../models/EarningsLedgerModel.js";
import Notification from "../models/NotificationModel.js";
import Payments from "../models/payments_model.js";

// CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const user = req.user;

    if (user.role === "superadmin") {
      return res.status(403).json({
        message: "Superadmin cannot place orders",
      });
    }

    const {
      shippingAddress,
      paymentMethod,
      paymentDetails, // Razorpay details
    } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        message: "Shipping address is required",
      });
    }

    // GET USER CART
    const cart = await Cart.findOne({
      where: { userId: user.id },
      include: {
        model: CartItem,
        as: "items",
      },
    });

    if (!cart || !cart.items.length) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    // CREATE ORDER FIRST
    const order = await Order.create({
      userId: user.id,
      shippingAddress,
      deliveryPincode: shippingAddress.pincode || req.body.deliveryPincode || user.pincode || "000000",
      phone: shippingAddress.phone || user.phone || "0000000000",
      paymentMethod: paymentMethod || "Cash on Delivery",
      paymentStatus:
        paymentMethod === "Razorpay"
          ? paymentDetails?.status || "Pending"
          : "Pending",
      isPaid: paymentMethod === "Razorpay" && paymentDetails?.status === "Success",
    });

    // MOVE CART ITEMS TO ORDER ITEMS
    for (const item of cart.items) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        productname: item.productname,
        category: item.category,
        stock: item.stock,
        unit: item.unit,
        qty: item.qty,
        productprice: item.productprice,
        discountvalue: item.discountvalue,
        sellingPrice: item.sellingPrice,
        sellingPriceGst: item.sellingPriceGst,
        totalSellingPriceGst: item.totalSellingPriceGst,
        gstpercentage: item.gstpercentage,
        hsncode: item.hsncode,
        adminEarningValue: item.adminEarningValue,
        supervisorEarningValue: item.supervisorEarningValue,
        employeeEarningValue: item.employeeEarningValue,
      });
    }

    // RE-CALCULATE TOTALS
    await order.save();

    // HANDLE PAYMENT MODEL ENTRY
    if (paymentMethod === "Razorpay") {
      await Payments.create({
        userId: user.id,
        orderId: order.id,
        username: user.name,
        role: user.role,
        transaction_id:
          paymentDetails?.transaction_id ||
          `RAZORPAY-${Date.now()}`,
        razorpay_order_id:
          paymentDetails?.razorpay_order_id || null,
        razorpay_payment_id:
          paymentDetails?.razorpay_payment_id || null,
        razorpay_signature:
          paymentDetails?.razorpay_signature || null,
        payment_method: "razorpay",
        credited_amount: order.totalPrice,
        currency: "INR",
        status: paymentDetails?.status || "Pending",
        failure_reason:
          paymentDetails?.failure_reason || null,
      });
    } else {
      await Payments.create({
        userId: user.id,
        orderId: order.id,
        username: user.name,
        role: user.role,
        transaction_id: `COD-${Date.now()}`,
        payment_method: "cod",
        credited_amount: order.totalPrice,
        currency: "INR",
        status: "Pending",
      });
    }

    // EMPLOYEE ASSIGNMENT    // ONLY IF COD OR PAYMENT SUCCESS
    let assignedEmployee = null;

    if (
      paymentMethod === "Cash on Delivery" ||
      (paymentMethod === "Razorpay" &&
        paymentDetails?.status === "Success")
    ) {
      assignedEmployee = await User.findOne({
        where: {
          role: "employee",
          pincode: shippingAddress.pincode,
          status: "active",
        },
      });

      if (assignedEmployee) {
        order.assignedEmployeeId = assignedEmployee.id;
        await order.save();

        await Notification.create({
          userId: assignedEmployee.id,
          title: "New Order Received",
          message: `New order ${order.orderId} assigned to your pincode.`,
          type: "order",
          roleToDisplay: ["employee"],
        });
      }
    }

    // WEBSITE STAFF NOTIFICATION
    const websiteUsers = await User.findAll({
      where: {
        role: {
          [Op.in]: ["superadmin", "admin", "supervisor"],
        },
      },
    });

    for (const staff of websiteUsers) {
      await Notification.create({
        userId: staff.id,
        title: "New Order Placed",
        message: `Order ${order.orderId} has been placed by ${user.name}.`,
        type: "order",
        roleToDisplay: [staff.role],
      });
    }

    // PAYMENT FAILED OR PENDING
    if (
      paymentMethod === "Razorpay" &&
      paymentDetails?.status !== "Success"
    ) {
      order.status = "Pending";
      order.paymentStatus =
        paymentDetails?.status || "Failed";
      order.isPaid = false;
      order.assignedEmployeeId = null;

      await order.save();
    }

    // CLEAR CART
    await cart.destroy();

    return res.status(201).json({
      message: "Order created successfully",
      order,
    });

  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// GET MY ORDERS
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: {
        userId: req.user.id,
      },
      include: [
        {
          model: OrderItem,
          as: "orderItems",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      totalOrders: orders.length,
      orders,
    });

  } catch (error) {
    console.error("Get My Orders Error:", error);

    return res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// GET ORDER BY ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          as: "orderItems",
        },
        {
          model: User,
          attributes: ["id", "name", "phone", "role", "pincode"],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // CUSTOMER can only view own orders
    if (
      req.user.role === "customer" &&
      order.userId !== req.user.id
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // EMPLOYEE can only view assigned pincode orders
    if (
      req.user.role === "employee" &&
      order.shippingAddress?.pincode !== req.user.pincode
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return res.status(200).json(order);

  } catch (error) {
    console.error("Get Order By ID Error:", error);

    return res.status(500).json({
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// GET ALL ORDERS (WEBSITE STAFF)
export const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Order.findAndCountAll({
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "phone",
            "role",
            "pincode",
            "referalcode",
          ],
        },
        {
          model: OrderItem,
          as: "orderItems",
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      orders: rows,
    });

  } catch (error) {
    console.error("Get All Orders Error:", error);

    return res.status(500).json({
      message: "Failed to fetch all orders",
      error: error.message,
    });
  }
};

// SEARCH ORDERS BY PHONE
export const getOrdersBySearchPhone = async (req, res) => {
  try {
    const { phone } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Order.findAndCountAll({
      where: {
        phone: {
          [Op.like]: `%${phone}%`,
        },
      },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "phone",
            "role",
            "pincode",
          ],
        },
        {
          model: OrderItem,
          as: "orderItems",
        },
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      orders: rows,
    });

  } catch (error) {
    console.error("Search Orders By Phone Error:", error);

    return res.status(500).json({
      message: "Failed to search orders",
      error: error.message,
    });
  }
};

// GET EMPLOYEE ORDERS BY PINCODE
export const getOrdersByEmployeePincode = async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({
        message: "Employee access only",
      });
    }

    const orders = await Order.findAll({
      where: {
        assignedEmployeeId: req.user.id,
      },
      include: [
        {
          model: OrderItem,
          as: "orderItems",
        },
        {
          model: User,
          attributes: [
            "id",
            "name",
            "phone",
            "role",
            "pincode",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      totalOrders: orders.length,
      orders,
    });

  } catch (error) {
    console.error("Get Employee Orders Error:", error);

    return res.status(500).json({
      message: "Failed to fetch employee orders",
      error: error.message,
    });
  }
};



// CUSTOMER REQUEST CANCEL
export const requestCancelOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    order.status = "Cancel Request";
    await order.save();

    // Notify employee
    const employee = await User.findOne({
      where: {
        role: "employee",
        pincode: order.shippingAddress.pincode,
      },
    });

    if (employee) {
      await Notification.create({
        userId: employee.id,
        title: "Cancel Request",
        message: `Order ${order.orderId} has cancel request.`,
        type: "order",
        roleToDisplay: "employee",
      });
    }

    // Notify website staff
    const staff = await User.findAll({
      where: {
        role: {
          [Op.in]: ["superadmin", "admin", "supervisor"],
        },
      },
    });

    for (const user of staff) {
      await Notification.create({
        userId: user.id,
        title: "Cancel Request",
        message: `Order ${order.orderId} requested cancellation.`,
        type: "order",
        roleToDisplay: user.role,
      });
    }

    return res.json({
      message: "Cancel request submitted",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to request cancel",
      error: error.message,
    });
  }
};

// CUSTOMER REQUEST RETURN
export const requestReturnOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    order.status = "Return Request";
    await order.save();

    const staff = await User.findAll({
      where: {
        role: {
          [Op.in]: ["superadmin", "admin", "supervisor"],
        },
      },
    });

    for (const user of staff) {
      await Notification.create({
        userId: user.id,
        title: "Return Request",
        message: `Order ${order.orderId} requested return.`,
        type: "order",
        roleToDisplay: user.role,
      });
    }

    return res.json({
      message: "Return request submitted",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to request return",
      error: error.message,
    });
  }
};



// EMPLOYEE STATUS UPDATE
export const employeeUpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Accepted",
      "Rejected",
      "Out for Delivery",
      "Return - Approved",
      "Cancelled",
      "Delivered",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(403).json({
        message: "Invalid employee status update",
      });
    }

    const order = await Order.findByPk(req.params.id, {
      include: {
        model: OrderItem,
        as: "orderItems",
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    order.status = status;

    if (status === "Delivered") {
      order.isDelivered = true;

      const customer = await User.findByPk(order.userId);

      const admin = await User.findByPk(customer.parentId);
      const supervisor = admin
        ? await User.findByPk(admin.parentId)
        : null;
      const employee = req.user;

      if (admin) {
        admin.earnings += parseFloat(order.totalAdminEarning);
        await admin.save();

        await EarningsLedger.create({
          userId: admin.id,
          orderId: order.id,
          amount: order.totalAdminEarning,
          role: "admin",
        });

        await Notification.create({
          userId: admin.id,
          title: "Earnings Added",
          message: `₹${order.totalAdminEarning} credited from order ${order.orderId}`,
          type: "earning",
          roleToDisplay: "admin",
        });
      }

      if (supervisor) {
        supervisor.earnings += parseFloat(order.totalSupervisorEarning);
        await supervisor.save();

        await EarningsLedger.create({
          userId: supervisor.id,
          orderId: order.id,
          amount: order.totalSupervisorEarning,
          role: "supervisor",
        });

        await Notification.create({
          userId: supervisor.id,
          title: "Earnings Added",
          message: `₹${order.totalSupervisorEarning} credited from order ${order.orderId}`,
          type: "earning",
          roleToDisplay: "supervisor",
        });
      }

      employee.earnings += parseFloat(order.totalEmployeeEarning);
      await employee.save();

      await EarningsLedger.create({
        userId: employee.id,
        orderId: order.id,
        amount: order.totalEmployeeEarning,
        role: "employee",
      });

      await Notification.create({
        userId: employee.id,
        title: "Earnings Added",
        message: `₹${order.totalEmployeeEarning} credited from order ${order.orderId}`,
        type: "earning",
        roleToDisplay: "employee",
      });
    }

    await order.save();

    // Notify customer
    await Notification.create({
      userId: order.userId,
      title: "Order Status Updated",
      message: `Order ${order.orderId} status updated to ${status}`,
      type: "order",
      roleToDisplay: "customer",
    });

    return res.json({
      message: "Order updated successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to update order",
      error: error.message,
    });
  }
};

// SUPERVISOR STATUS UPDATE
export const supervisorUpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Shipped",
      "Rejected",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(403).json({
        message: "Invalid supervisor status update",
      });
    }

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    order.status = status;
    await order.save();

    return res.json({
      message: "Order updated successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to update order",
      error: error.message,
    });
  }
};

// ADMIN / SUPERADMIN STATUS UPDATE
export const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Shipped",
      "Rejected",
      "Cancelled",
      "Return - Initiated",
      "Return - Rejected",
      "Returned & Refunded",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(403).json({
        message: "Invalid admin status update",
      });
    }

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    order.status = status;
    await order.save();

    await Notification.create({
      userId: order.userId,
      title: "Order Status Updated",
      message: `Order ${order.orderId} status updated to ${status}`,
      type: "order",
      roleToDisplay: "customer",
    });

    return res.json({
      message: "Order updated successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to update order",
      error: error.message,
    });
  }
};