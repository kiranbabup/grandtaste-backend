//  node scripts/createDefaultUsers.js
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

const createDefaultUsers = async () => {
  try {
    await connectDB();

    //
    // SUPERADMIN
    //
    let superadmin = await User.findOne({
      where: { phone: "9638527410" },
    });

    if (!superadmin) {
      superadmin = await User.create({
        name: "superadmin",
        role: "superadmin",
        referalcode: "superadmin",
        referedby: null,
        phone: "9638527410",
        password: "SuperAdmin@gt1",
      });

      console.log("Superadmin created");
    }

    //
    // ADMIN
    //
    let admin = await User.findOne({
      where: { phone: "9876543201" },
    });

    if (!admin) {
      admin = await User.create({
        name: "grandTadmin",
        role: "admin",
        referalcode: "admin1",
        referedby: "superadmin",
        parentId: superadmin.id,
        phone: "9876543201",
        password: "123456",
      });

      superadmin.directReferrals += 1;
      await superadmin.save();

      console.log("Admin created");
    }

    //
    // SUPERVISOR
    //
    let supervisor = await User.findOne({
      where: { phone: "9111111111" },
    });

    if (!supervisor) {
      supervisor = await User.create({
        name: "grandTsupervisor",
        role: "supervisor",
        referalcode: "visor1",
        referedby: "admin1",
        parentId: admin.id,
        phone: "9111111111",
        password: "123456",
      });

      admin.directReferrals += 1;
      await admin.save();

      console.log("Supervisor created");
    }

    //
    // EMPLOYEE
    //
    let employee = await User.findOne({
      where: { phone: "8111111111" },
    });

    if (!employee) {
      employee = await User.create({
        name: "grandTemployee",
        role: "employee",
        referalcode: "employ1",
        referedby: "visor1",
        parentId: supervisor.id,
        phone: "8111111111",
        password: "123456",
        pincode: "530000",
      });

      supervisor.directReferrals += 1;
      await supervisor.save();

      console.log("Employee created");
    }

    //
    // CUSTOMER
    //
    let customer = await User.findOne({
      where: { phone: "7111111111" },
    });

    if (!customer) {
      customer = await User.create({
        name: "grandTcustomer",
        role: "customer",
        referalcode: null,
        referedby: "employ1",
        parentId: employee.id,
        phone: "7111111111",
        password: "123456",
        pincode: "530000",
      });

      employee.directReferrals += 1;
      await employee.save();

      console.log("Customer created");
    }

    console.log("Default hierarchy users created successfully!");
    process.exit(0);

  } catch (error) {
    console.error("Failed to create default users:", error);
    process.exit(1);
  }
};

createDefaultUsers();