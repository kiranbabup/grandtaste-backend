import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./User.js";
import BankDetail from "./BankDetailsModel.js";

const Withdraw = sequelize.define(
  "Withdraw",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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

    withdrawAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        "pending",
        "inprogress",
        "sent",
        "failed",
        "rejected"
      ),
      defaultValue: "pending",
    },

    ac_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    ifsc_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    branch_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    ac_holder_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    upi: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    payment_transaction_ID: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    payment_mode: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "bank_transfer / upi",
    },
  },
  {
    timestamps: true,
    tableName: "withdraws",
  }
);

// Associations
User.hasMany(Withdraw, {
  foreignKey: "userId",
  as: "withdraws",
});

Withdraw.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(BankDetail, {
  foreignKey: "userId",
  as: "bankDetails",
});

BankDetail.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

export default Withdraw;