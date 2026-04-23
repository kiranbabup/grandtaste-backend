import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./User.js";
import Product from "./Product.js";

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: "id",
      },
    },
    shippingAddress: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: "Contains addressType, street, city, state, zip, country",
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      defaultValue: "Cash on Delivery",
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isDelivered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM(
        "Pending",
        "Accepted",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Rejected",
        "Cancelled"
      ),
      defaultValue: "Pending",
    },
  },
  {
    timestamps: true,
    tableName: "orders",
  }
);

// Order Items as a separate table
const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Order,
        key: "id",
      },
    },
    productId: {
      type: DataTypes.INTEGER,
      references: {
        model: Product,
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
    },
    qty: {
      type: DataTypes.INTEGER,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
    },
  },
  {
    timestamps: true,
    tableName: "order_items",
  }
);

// Associations
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "orderItems", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });
Order.belongsTo(User, { foreignKey: "userId" });

export { Order, OrderItem };