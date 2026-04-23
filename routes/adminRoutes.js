import express from "express";
import { Order } from "../models/Order.js";
import User from "../models/User.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get real total income (Sum of 'Delivered' orders), total orders count, and monthly income data
router.get("/monthly-income", protect, admin, async (req, res) => {
    try {
        const deliveredOrders = await Order.findAll({ where: { status: "Delivered" } });
        const totalOrdersCount = await Order.count();

        let totalIncome = 0;
        let monthlyDataMap = {};

        deliveredOrders.forEach(order => {
            totalIncome += order.totalPrice;

            // Format month: e.g., "Jan", "Feb"
            const date = new Date(order.createdAt);
            const monthName = date.toLocaleString('default', { month: 'short' });

            if (!monthlyDataMap[monthName]) {
                monthlyDataMap[monthName] = 0;
            }
            monthlyDataMap[monthName] += order.totalPrice;
        });

        // Convert map to array format for Recharts
        const formattedMonthlyData = Object.keys(monthlyDataMap).map(month => ({
            month,
            income: monthlyDataMap[month]
        }));

        res.json({
            success: true,
            totalIncome,
            totalOrders: totalOrdersCount,
            data: formattedMonthlyData
        });
    } catch (error) {
        console.error("Error fetching monthly income:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Update the user count endpoints to fetch real data
router.get("/all-admins", protect, admin, async (req, res) => {
    const admins = await User.findAll({ where: { role: 'admin' } });
    res.json({ success: true, data: admins });
});

router.get("/all-supervisors", protect, admin, async (req, res) => {
    const supervisors = await User.findAll({ where: { role: 'supervisor' } });
    res.json({ success: true, data: supervisors });
});

router.get("/all-employees", protect, admin, async (req, res) => {
    const employees = await User.findAll({ where: { role: 'employee' } });
    res.json({ success: true, data: employees });
});

export default router;
