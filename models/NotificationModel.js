import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./User.js";

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Actual recipient user ID",
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    type: {
      type: DataTypes.STRING,
      defaultValue: "general",
      comment:
        "general / order / earning / withdraw / alert / system",
    },

    roleToDisplay: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment:
        "Array of roles that should display this notification ['admin','supervisor']",
    },

    relatedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment:
        "Related orderId / withdrawId / productId",
    },

    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    tableName: "notifications",
  }
);

User.hasMany(Notification, {
  foreignKey: "userId",
  as: "notifications",
});

Notification.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

export default Notification;