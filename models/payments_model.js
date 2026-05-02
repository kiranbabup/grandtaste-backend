// UPDATED payments_model.js

import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./User.js";
import { Order } from "./Order.js";

const Payments = sequelize.define(
  "Payments",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "orders",
        key: "id",
      },
      onDelete: "SET NULL",
    },

    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    role: {
      type: DataTypes.ENUM(
        "admin",
        "supervisor",
        "employee",
        "customer"
      ),
      defaultValue: "customer",
      allowNull: false,
    },

    transaction_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    razorpay_order_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    razorpay_payment_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    razorpay_signature: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    payment_method: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "razorpay / cod",
    },

    credited_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    currency: {
      type: DataTypes.STRING,
      defaultValue: "INR",
    },

    status: {
      type: DataTypes.ENUM(
        "Pending",
        "Failed",
        "Success"
      ),
      allowNull: false,
      defaultValue: "Failed",
    },

    failure_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    createdAt: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: () => new Date().toISOString(),
    },

    updatedAt: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: () => new Date().toISOString(),
    },
  },
  {
    tableName: "payments",
    timestamps: false,
  }
);

// ASSOCIATIONS
User.hasMany(Payments, {
  foreignKey: "userId",
  as: "payments",
});

Payments.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Order.hasMany(Payments, {
  foreignKey: "orderId",
  as: "payments",
});

Payments.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

export default Payments;