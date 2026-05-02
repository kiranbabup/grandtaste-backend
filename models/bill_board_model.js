// bill_board_model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const BillBoards = sequelize.define(
  "BillBoards",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    createdAt: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: () => new Date().toISOString(),
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: () => new Date().toISOString(),
    },
  },
  {
    tableName: "bill_boards",
    timestamps: false,
  }
);
export default BillBoards;
