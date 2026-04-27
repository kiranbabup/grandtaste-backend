import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import { sequelize } from "../config/db.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "customer",
      comment: "superadmin / admin / supervisor / employee / customer",
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    referedby: {
      type: DataTypes.STRING,
    },
    referalcode: {
      type: DataTypes.STRING,
      unique: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "active",
    },
    earnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      comment: "Cumulative referral earnings for admin / supervisor / employee",
    },
    details: {
      type: DataTypes.JSON,
    },
    addresses: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: "Array of address objects",
    },
  },
  {
    timestamps: true,
    tableName: "users",
  }
);

// Hash password before save
User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// Method to compare password
User.prototype.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default User;