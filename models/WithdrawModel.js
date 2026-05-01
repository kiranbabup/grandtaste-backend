import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./UserModel.js";

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

export default Withdraw;