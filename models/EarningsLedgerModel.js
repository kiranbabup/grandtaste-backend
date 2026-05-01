import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./User.js";

const EarningsLedger = sequelize.define(
  "EarningsLedger",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    fromUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "User who generated this earning",
    },

    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    level: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "admin / supervisor / employee",
    },

    status: {
      type: DataTypes.ENUM("pending", "credited", "reversed"),
      defaultValue: "credited",
    },
  },
  {
    timestamps: true,
    tableName: "earnings_ledger",
  }
);

User.hasMany(EarningsLedger, {
  foreignKey: "userId",
  as: "earningsHistory",
});

EarningsLedger.belongsTo(User, {
  foreignKey: "userId",
  as: "earner",
});

export default EarningsLedger;