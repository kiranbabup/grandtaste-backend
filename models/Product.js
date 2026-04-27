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
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    image: {
      type: DataTypes.STRING,
      comment: "Keeping for backward compatibility",
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: "Array of firebase URLs",
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: "spices",
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
  },
  {
    timestamps: true,
    tableName: "products",
  }
);

export default Product;