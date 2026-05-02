import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./User.js";

const BankDetail = sequelize.define(
    "BankDetail",
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
        
        ac_holder_name: {
            type: DataTypes.STRING,
            allowNull: false,
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

        upi: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        isDefault: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        tableName: "bank_details",
        timestamps: true,
    }
);
export default BankDetail;