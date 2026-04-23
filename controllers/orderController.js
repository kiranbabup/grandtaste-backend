import { Order, OrderItem } from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";

export const createOrder = async (req, res) => {
  const { orderItems, shippingAddress, phone, paymentMethod, totalPrice } = req.body;

  if (orderItems && orderItems.length === 0) {
    return res.status(400).json({ message: "No order items" });
  }

  const order = await Order.create({
    userId: req.user.id,
    shippingAddress,
    phone,
    paymentMethod,
    totalPrice,
  });

  // Create order items
  for (const item of orderItems) {
    await OrderItem.create({
      orderId: order.id,
      productId: item.product,
      name: item.name,
      qty: item.qty,
      price: item.price,
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
  const orders = await Order.findAll({
    include: [
      { model: User },
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

  res.json(orders);
};

export const getMyOrders = async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.user.id },
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
  res.json(orders);
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