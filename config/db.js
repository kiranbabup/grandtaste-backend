import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME || "grandtaste",
  process.env.DB_USER || "root",
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
    // Sync models with database
    await sequelize.sync({ alter: false });
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

export { sequelize, connectDB };