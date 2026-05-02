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
  },
  {
    tableName: "bill_boards",
    timestamps: true,
  }
);
export default BillBoards;
