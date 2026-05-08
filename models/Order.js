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
    totalGstAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: "Total GST amount for entire order",
    },
    assignedEmployeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Employee assigned based on pincode",
    },
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: true,

    },
    supervisorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deliveryPincode: {
      type: DataTypes.STRING,
      allowNull: false,
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
        "Rejected",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
        "Cancel initiated",
        "Cancel Request",
        "Return Request",
        "Return - Initiated",
        "Return - Approved",
        "Return - Rejected",
        "Returned & Refunded",
      ),
      defaultValue: "Pending",
    },
    paymentStatus: {
      type: DataTypes.ENUM(
        "Pending",
        "In-Progress",
        "Successful",
        "Failed",
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
    category: {
      type: DataTypes.STRING,
    },

    stock: {
      type: DataTypes.INTEGER,
    },

    unit: {
      type: DataTypes.STRING,
    },

    qty: {
      type: DataTypes.INTEGER,
    },
    productprice: {
      type: DataTypes.DECIMAL(10, 2),
    },
    discountvalue: {
      type: DataTypes.DECIMAL(10, 2),
    },
    sellingPrice: {
      type: DataTypes.DECIMAL(10, 2),
    },
    sellingPriceGst: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: "GST amount included in single item selling price",
    },

    totalSellingPriceGst: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: "Total GST for qty",
    },
    gstpercentage: {
      type: DataTypes.DECIMAL(10, 2),
    },
    hsncode: {
      type: DataTypes.STRING,
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
    const lastNumber = parseInt(lastOrder.orderId.replace('inv0', ''), 10);
    const newNumber = lastNumber + 1;
    order.orderId = `inv0${newNumber}`;
  } else {
    order.orderId = 'inv01';
  }
});

Order.beforeSave(async (order) => {
  if (!order.id) return;

  const orderItems = await OrderItem.findAll({
    where: { orderId: order.id },
  });

  let totalPrice = 0;
  let totalAdminEarning = 0;
  let totalSupervisorEarning = 0;
  let totalEmployeeEarning = 0;
  let totalGstAmount = 0;

  orderItems.forEach((item) => {
    totalPrice += parseFloat(item.sellingPrice || 0) * parseInt(item.qty || 0);

    totalAdminEarning +=
      parseFloat(item.adminEarningValue || 0) * parseInt(item.qty || 0);

    totalSupervisorEarning +=
      parseFloat(item.supervisorEarningValue || 0) * parseInt(item.qty || 0);

    totalEmployeeEarning +=
      parseFloat(item.employeeEarningValue || 0) * parseInt(item.qty || 0);

    totalGstAmount +=
      parseFloat(item.totalSellingPriceGst || 0);
  });

  order.totalPrice = totalPrice;
  order.totalAdminEarning = totalAdminEarning;
  order.totalSupervisorEarning = totalSupervisorEarning;
  order.totalEmployeeEarning = totalEmployeeEarning;
  order.totalGstAmount = totalGstAmount;
});

// Associations
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "orderItems", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });
Order.belongsTo(User, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "assignedEmployeeId", as: "assignedEmployee" });

export { Order, OrderItem };