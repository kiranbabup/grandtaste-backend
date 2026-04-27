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
    orderId: {
      type: DataTypes.STRING,
      unique: true,
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
    totalAdminEarning: {
      type: DataTypes.DECIMAL(10, 2),
    },
    totalSupervisorEarning: {
      type: DataTypes.DECIMAL(10, 2),
    },
    totalEmployeeEarning: {
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
        "Accepted",
        "Cancelled",
        "Delivered",
        "Out for Delivery",
        "Pending",
        "Rejected",
        "Return Request",
        "Return - Initiated",
        "Return - Approved",
        "Return - Rejected",
        "Returned & Refunded",
        "Shipped",
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
    productname: {
      type: DataTypes.STRING,
    },
    qty: {
      type: DataTypes.INTEGER,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
    },
    adminEarningValue: {
      type: DataTypes.DECIMAL(10, 2),
    },
    supervisorEarningValue: {
      type: DataTypes.DECIMAL(10, 2),
    },
    employeeEarningValue: {
      type: DataTypes.DECIMAL(10, 2),
    },
  },
  {
    timestamps: true,
    tableName: "order_items",
  }
);

// Hook to auto-generate orderId
Order.beforeCreate(async (order) => {
  const lastOrder = await Order.findOne({
    order: [['id', 'DESC']],
  });

  if (lastOrder && lastOrder.orderId) {
    const lastNumber = parseInt(lastOrder.orderId.replace('grand', ''), 10);
    const newNumber = lastNumber + 1;
    order.orderId = `grand${newNumber.toString().padStart(5, '0')}`;
  } else {
    order.orderId = 'grand00001';
  }
});

// Associations
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "orderItems", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });
Order.belongsTo(User, { foreignKey: "userId" });

export { Order, OrderItem };