import { Order, OrderItem } from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { Op } from "sequelize";

export const createOrder = async (req, res) => {
  const { orderItems, shippingAddress, phone, paymentMethod, totalPrice } = req.body;

  if (orderItems && orderItems.length === 0) {
    return res.status(400).json({ message: "No order items" });
  }

  let totalAdminEarning = 0;
  let totalSupervisorEarning = 0;
  let totalEmployeeEarning = 0;

  for (const item of orderItems) {
    const qty = Number(item.qty) || 1;
    totalAdminEarning += (Number(item.adminEarningValue) || 0) * qty;
    totalSupervisorEarning += (Number(item.supervisorEarningValue) || 0) * qty;
    totalEmployeeEarning += (Number(item.employeeEarningValue) || 0) * qty;
  }

  const order = await Order.create({
    userId: req.user.id,
    shippingAddress,
    phone,
    paymentMethod,
    totalPrice,
    totalAdminEarning,
    totalSupervisorEarning,
    totalEmployeeEarning
  });

  // Create order items
  for (const item of orderItems) {
    await OrderItem.create({
      orderId: order.id,
      productId: item.product,
      productname: item.productname,
      qty: item.qty,
      price: item.price,
      discount: item.discount,
      adminEarningValue: item.adminEarningValue,
      supervisorEarningValue: item.supervisorEarningValue,
      employeeEarningValue: item.employeeEarningValue,
    });
  }

  const createdOrder = await Order.findByPk(order.id, {
    include: [
      {
        model: OrderItem,
        as: "orderItems",
        include: [
          {
            model: Product,
            as: "product",
          },
        ],
      },
      {
        model: User,
      },
    ],
  });

  res.status(201).json(createdOrder);
};

export const getAllOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await Order.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true, // Prevents duplicate counts from includes
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'phone'] },
        {
          model: OrderItem,
          as: "orderItems",
          include: [
            {
              model: Product,
              as: "product",
            },
          ],
        },
      ],
    });

    res.json({
      totalItems: count,
      orders: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await Order.findAndCountAll({
      where: { userId: req.user.id },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
      include: {
        model: OrderItem,
        as: "orderItems",
        include: [
          {
            model: Product,
            as: "product",
          },
        ],
      },
    });

    res.json({
      totalItems: count,
      orders: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user orders", error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (order) {
      await order.update({ status });
      res.json(order);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
        {
          model: OrderItem,
          as: "orderItems",
          include: [
            {
              model: Product,
              as: "product",
            },
          ],
        },
      ],
    });

    if (order) {
      // Allow only the admin or the user who created the order to view it
      if (req.user.role === "admin" || order.userId === req.user.id) {
        res.json(order);
      } else {
        res.status(403).json({ message: "Not authorized to view this order" });
      }
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Invalid order ID or server error" });
  }
};

// Helper function to get all downline user IDs
const getDownlineUserIds = async (user) => {
  let downlineIds = [];

  if (user.role === 'admin') {
    const supervisors = await User.findAll({ where: { referedby: user.referalcode }, attributes: ['id', 'referalcode'] });
    downlineIds.push(...supervisors.map(u => u.id));

    const supervisorCodes = supervisors.map(s => s.referalcode).filter(Boolean);
    if (supervisorCodes.length > 0) {
      const employees = await User.findAll({ where: { referedby: { [Op.in]: supervisorCodes } }, attributes: ['id', 'referalcode'] });
      downlineIds.push(...employees.map(u => u.id));

      const employeeCodes = employees.map(e => e.referalcode).filter(Boolean);
      if (employeeCodes.length > 0) {
        const customers = await User.findAll({ where: { referedby: { [Op.in]: employeeCodes } }, attributes: ['id'] });
        downlineIds.push(...customers.map(u => u.id));
      }
    }
  } else if (user.role === 'supervisor') {
    const employees = await User.findAll({ where: { referedby: user.referalcode }, attributes: ['id', 'referalcode'] });
    downlineIds.push(...employees.map(u => u.id));

    const employeeCodes = employees.map(e => e.referalcode).filter(Boolean);
    if (employeeCodes.length > 0) {
      const customers = await User.findAll({ where: { referedby: { [Op.in]: employeeCodes } }, attributes: ['id'] });
      downlineIds.push(...customers.map(u => u.id));
    }
  } else if (user.role === 'employee') {
    const customers = await User.findAll({ where: { referedby: user.referalcode }, attributes: ['id'] });
    downlineIds.push(...customers.map(u => u.id));
  }

  return downlineIds;
};

// @desc    Get user earnings from delivered downline orders
// @route   GET /api/orders/userOrderEarning
// @access  Private
export const userOrderEarning = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.role === 'customer' || user.role === 'superadmin') {
      return res.status(403).json({ message: "This role does not have referral earnings" });
    }

    const downlineIds = await getDownlineUserIds(user);
    if (downlineIds.length === 0) {
      return res.json({ totalEarningsAllTime: 0, totalItems: 0, orders: [], totalPages: 0, currentPage: 1 });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Order.findAndCountAll({
      where: {
        userId: { [Op.in]: downlineIds },
        status: 'Delivered'
      },
      include: [
        { model: User, attributes: ['id', 'name'] }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const mappedOrders = rows.map(order => {
      let earningFromThisOrder = 0;
      if (user.role === 'admin') earningFromThisOrder = Number(order.totalAdminEarning) || 0;
      if (user.role === 'supervisor') earningFromThisOrder = Number(order.totalSupervisorEarning) || 0;
      if (user.role === 'employee') earningFromThisOrder = Number(order.totalEmployeeEarning) || 0;

      return {
        orderId: order.orderId,
        purchasedByUserId: order.userId,
        purchasedByUserName: order.User ? order.User.name : 'Unknown',
        orderDate: order.createdAt,
        earningFromThisOrder
      };
    });

    // Aggregate total earnings across all time (not just this page)
    const earningField = user.role === 'admin' ? 'totalAdminEarning' : 
                         user.role === 'supervisor' ? 'totalSupervisorEarning' : 'totalEmployeeEarning';
    
    const totalAggregation = await Order.sum(earningField, {
      where: {
        userId: { [Op.in]: downlineIds },
        status: 'Delivered'
      }
    });

    res.json({
      totalEarningsAllTime: totalAggregation || 0,
      totalItems: count,
      orders: mappedOrders,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch earnings", error: error.message });
  }
};