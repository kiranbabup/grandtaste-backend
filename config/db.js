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
    timezone: "+05:30", // For writing to database in IST
    dialectOptions: {
      useUTC: false, // For reading from database in IST
      dateStrings: true,
      typeCast: true,
    },
    define: {
      timestamps: true,
      underscored: false,
    },
  }
);

const loadModels = async () => {
  const loadedModels = await Promise.all([
    import("../models/User.js"),
    import("../models/Product.js"),
    import("../models/Order.js"),
    import("../models/Cart.js"),
    import("../models/Wishlist.js"),
    import("../models/AddressModel.js"),
    import("../models/BankDetailsModel.js"),
    import("../models/bill_board_model.js"),
    import("../models/EarningsLedgerModel.js"),
    import("../models/NotificationModel.js"),
    import("../models/payments_model.js"),
    import("../models/WithdrawModel.js"),
  ]);

  const names = loadedModels.map((m) => m.default?.name || "unknown");
  console.log("Loaded models:", names.join(", "));
};

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL Connected");

    await loadModels();

    const forceSync = process.env.FORCE_DB_SYNC === "true";
    const shouldSync = process.env.NODE_ENV !== "production" || forceSync;

    if (shouldSync) {
      // const syncOptions = forceSync ? { alter: true } : {};
      const syncOptions = forceSync ? { force: false } : {};
      console.log(
        `Running sequelize sync with options: ${JSON.stringify(syncOptions)}`
      );

      await sequelize.sync(syncOptions).then(() => {
        console.log("Sequelize sync completed successfully");
        console.log("Registered models:", Object.keys(sequelize.models).join(", "));
      }).catch(async (err) => {
        const errorCode = err.code || err.parent?.code || err.original?.code;
        const ignoredErrors = ['ER_DUP_KEYNAME', 'ER_TOO_MANY_KEYS', 'ER_DUP_ENTRY', 'ER_KEY_COLUMN_DOES_NOT_EXIST'];

        if (errorCode === 'ER_TOO_MANY_KEYS' && forceSync) {
          console.warn("Alter sync failed due to too many keys. Falling back to create-only sync.", err.message);
          await sequelize.sync().then(() => {
            console.log("Fallback create-only sync completed successfully");
            console.log("Registered models:", Object.keys(sequelize.models).join(", "));
          }).catch((fallbackErr) => {
            console.error("Fallback sync failed:", fallbackErr);
            throw fallbackErr;
          });
          return;
        }

        if (ignoredErrors.includes(errorCode)) {
          console.warn("Sequelize sync ignored error:", err.message);
          console.log("Registered models in error state:", Object.keys(sequelize.models).join(", "));
        } else {
          throw err;
        }
      });
    } else {
      console.log("Running in production – skipping automatic sync");
    }
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};


export { sequelize, connectDB };