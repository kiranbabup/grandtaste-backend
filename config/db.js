import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "grandtaste",
  process.env.DB_USER || "grandtaste_user",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
    logging: false, // Set to console.log to see SQL queries
    define: {
      timestamps: true,
      underscored: false,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL Connected");

    // In development we can still use `sync({ alter: true })`
    // but in production we only run migrations once.
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true }).catch((err) => {
        // Ignore duplicate key errors - indexes already exist
        if (err.code === 'ER_DUP_KEYNAME') {
          console.log("Table sync completed (some indexes may already exist)");
        } else {
          throw err;
        }
      });
    } else {
      // In production do nothing – rely on migrations.
      console.log("Running in production – skipping automatic sync");
    }
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};


export { sequelize, connectDB };