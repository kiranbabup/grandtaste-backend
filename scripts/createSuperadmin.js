// node scripts/createSuperadmin.js

import { connectDB, sequelize } from "../config/db.js";
import User from "../models/User.js";

const createSuperadmin = async () => {
  try {
    await connectDB();

    // Check if superadmin already exists
    const existingAdmin = await User.findOne({ where: { phone: "9638527410" } });

    if (existingAdmin) {
      console.log("Superadmin already exists!");
      process.exit(0);
    }

    const superadmin = await User.create({
      name: "superadmin",
      role: "superadmin",
      referalcode: "superadmin",
      referedby: "superadmin",
      phone: "9638527410",
      password: "SuperAdmin@gt1",
      status: "active"
    });

    console.log("Superadmin created successfully!");
    console.log(superadmin.toJSON());
    process.exit(0);
  } catch (error) {
    console.error("Failed to create superadmin:", error);
    process.exit(1);
  }
};

createSuperadmin();
