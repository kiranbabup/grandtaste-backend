import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./User.js";
import Product from "./Product.js";

const Cart = sequelize.define(
  "Cart",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // One cart per user
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    timestamps: true,
    tableName: "carts",
  }
);

// Cart Items
const CartItem = sequelize.define(
  "CartItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    cartId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Cart,
        key: "id",
      },
    },

    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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

    adminEarningValue: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    supervisorEarningValue: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    employeeEarningValue: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    // Snapshot fields
    productprice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    discountvalue: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    sellingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
      defaultValue: 0,
    },

    hsncode: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: true,
    tableName: "cart_items",

    indexes: [
      {
        unique: true,
        fields: ["cartId", "productId"], // Prevent duplicate products
      },
    ],
  }
);

// ASSOCIATIONS

Cart.hasMany(CartItem, {
  foreignKey: "cartId",
  as: "items",
  onDelete: "CASCADE",
});

CartItem.belongsTo(Cart, {
  foreignKey: "cartId",
});

CartItem.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

Cart.belongsTo(User, {
  foreignKey: "userId",
});

export { Cart, CartItem };