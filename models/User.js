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
            validate: {
                isEmail: true,
            },
        },

        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        role: {
            type: DataTypes.ENUM(
                "superadmin",
                "admin",
                "supervisor",
                "employee",
                "customer"
            ),
            defaultValue: "customer",
            allowNull: false,
        },

        phone: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        pincode: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "Employee assigned pincode / optional for others",
        },

        parentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "Referring user ID",
        },

        referedby: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "Referral code used during registration",
        },

        referalcode: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },

        status: {
            type: DataTypes.ENUM("active", "inactive", "blocked"),
            defaultValue: "active",
        },

        earnings: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.0,
            comment: "Referral commissions",
        },
        withdrawn: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.0,
            comment: "Total withdrawn amount",
        },
        directReferrals: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: "Number of direct users registered using this user's referral code",
        },
        
        details: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: "Extra user details",
        },
    },
    {
        timestamps: true,
        tableName: "users",
    }
);

// Password Hashing Hooks
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

// Password Compare Method
User.prototype.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

User.beforeSave((user) => {
  if (user.email) user.email = user.email.toLowerCase().trim();
  if (parseFloat(user.earnings) < 0) user.earnings = 0;
  if (parseFloat(user.withdrawn) < 0) user.withdrawn = 0;
  if (user.directReferrals < 0) user.directReferrals = 0;
});

export default User;
