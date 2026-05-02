import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    productname: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    images: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: "Array of Firebase URLs",
    },

    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "veg",
      comment: "veg / nonveg / beverages / snacks / etc",
    },

    productprice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Original MRP price",
    },

    discountvalue: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: "Discount amount",
    },

    sellingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Final selling price after discount",
    },

    gstpercentage: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    hsncode: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    unit: {
      type: DataTypes.STRING,
      defaultValue: "pcs",
      comment: "pcs / kg / g / ltr / ml",
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

    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
    },

    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
    tableName: "products",
  }
);

// Auto-calculate selling price before create
Product.beforeCreate((product) => {
  product.sellingPrice =
    parseFloat(product.productprice || 0) -
    parseFloat(product.discountvalue || 0);

  // Prevent negative selling price
  if (product.sellingPrice < 0) {
    product.sellingPrice = 0;
  }
});

// Auto-calculate before update
Product.beforeUpdate((product) => {
  product.sellingPrice =
    parseFloat(product.productprice || 0) -
    parseFloat(product.discountvalue || 0);

  if (product.sellingPrice < 0) {
    product.sellingPrice = 0;
  }
});
export default Product;