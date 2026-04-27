import express from "express";
import { Order } from "../models/Order.js";
import User from "../models/User.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { Op } from "sequelize";

// Helper function to get all downline user IDs (Admins see their tree, Superadmin sees all)
const getDownlineIds = async (user) => {
    if (user.role === 'superadmin') {
        const allUsers = await User.findAll({ attributes: ['id'] });
        return allUsers.map(u => u.id);
    }

    let downlineIds = [user.id]; // Include self

    if (user.role === 'admin' || user.role === 'supervisor') {
        const supervisors = await User.findAll({ where: { referedby: user.referalcode }, attributes: ['id', 'referalcode'] });
        downlineIds.push(...supervisors.map(u => u.id));

        const supervisorCodes = supervisors.map(s => s.referalcode).filter(Boolean);
        if (supervisorCodes.length > 0) {
            const employees = await User.findAll({ where: { referedby: { [Op.in]: supervisorCodes } }, attributes: ['id', 'referalcode'] });
            downlineIds.push(...employees.map(u => u.id));

            const employeeCodes = employees.map(e => e.referalcode).filter(Boolean);
            if (employeeCodes.length > 0) {
                const customers = await User.findAll({ where: { referedby: { [Op.in]: employeeCodes } }, attributes: ['id'] });
                downlineIds.push(...customers.map(u => u.id));
            }
        }
    }
    
    if (user.role === 'employee') {
        const customers = await User.findAll({ where: { referedby: user.referalcode }, attributes: ['id'] });
        downlineIds.push(...customers.map(u => u.id));
    }

    return downlineIds;
};

const router = express.Router();

// Get real total income (Sum of 'Delivered' orders), total orders count, and monthly income data
router.get("/monthly-income", protect, admin, async (req, res) => {
    try {
        const downlineIds = await getDownlineIds(req.user);
        const deliveredOrders = await Order.findAll({ 
            where: { 
                status: "Delivered",
                userId: { [Op.in]: downlineIds }
            } 
        });
        const totalOrdersCount = await Order.count({
            where: { userId: { [Op.in]: downlineIds } }
        });

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

// @desc    Get yearly income data grouped by year
// @route   GET /api/admin/yearly-income
router.get("/yearly-income", protect, admin, async (req, res) => {
    try {
        const downlineIds = await getDownlineIds(req.user);
        const deliveredOrders = await Order.findAll({ 
            where: { 
                status: "Delivered",
                userId: { [Op.in]: downlineIds }
            } 
        });

        let yearlyDataMap = {};

        deliveredOrders.forEach(order => {
            const date = new Date(order.createdAt);
            const year = date.getFullYear().toString();

            if (!yearlyDataMap[year]) {
                yearlyDataMap[year] = 0;
            }
            yearlyDataMap[year] += Number(order.totalPrice);
        });

        const formattedYearlyData = Object.keys(yearlyDataMap).map(year => ({
            year,
            income: yearlyDataMap[year]
        }));

        res.json({ success: true, data: formattedYearlyData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get total sales report (Summary by status)
// @route   GET /api/admin/total-sale-report
router.get("/total-sale-report", protect, admin, async (req, res) => {
    try {
        const downlineIds = await getDownlineIds(req.user);
        
        const orders = await Order.findAll({
            where: { userId: { [Op.in]: downlineIds } }
        });

        let reportMap = {};

        orders.forEach(order => {
            const status = order.status;
            if (!reportMap[status]) {
                reportMap[status] = { count: 0, totalValue: 0 };
            }
            reportMap[status].count += 1;
            reportMap[status].totalValue += Number(order.totalPrice);
        });

        const formattedReport = Object.keys(reportMap).map(status => ({
            status,
            count: reportMap[status].count,
            totalValue: reportMap[status].totalValue
        }));

        res.json({ success: true, report: formattedReport });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get dashboard stats based on hierarchy
// @route   GET /api/admin/dashboard-stats
router.get("/dashboard-stats", protect, async (req, res) => {
    try {
        const { role } = req.user;
        
        // Block customers/employees from dashboard
        if (role === 'customer' || role === 'employee') {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        const downlineIds = await getDownlineIds(req.user);

        const stats = {
            totalOrdersCount: await Order.count({ where: { userId: { [Op.in]: downlineIds } } }),
            totalSupervisorsCount: await User.count({ where: { id: { [Op.in]: downlineIds }, role: 'supervisor' } }),
            totalEmployeesCount: await User.count({ where: { id: { [Op.in]: downlineIds }, role: 'employee' } }),
            totalCustomersCount: await User.count({ where: { id: { [Op.in]: downlineIds }, role: 'customer' } }),
            totalSalesValue: await Order.sum('totalPrice', { 
                where: { 
                    userId: { [Op.in]: downlineIds }, 
                    status: 'Delivered' 
                } 
            }) || 0
        };

        // Only superadmin sees total admin count
        if (role === 'superadmin') {
            stats.totalAdminsCount = await User.count({ where: { role: 'admin' } });
        }

        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update the user count endpoints to fetch paginated data
router.get("/all-admins", protect, admin, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await User.findAndCountAll({
            where: { role: 'admin' },
            attributes: { exclude: ['password'] },
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            totalItems: count,
            data: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/all-supervisors", protect, admin, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await User.findAndCountAll({
            where: { role: 'supervisor' },
            attributes: { exclude: ['password'] },
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            totalItems: count,
            data: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/all-employees", protect, admin, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await User.findAndCountAll({
            where: { role: 'employee' },
            attributes: { exclude: ['password'] },
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            totalItems: count,
            data: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// @desc    Get detailed user info including their referrals (Downline)
// @route   GET /api/admin/get-my-details/:id
router.get("/get-my-details/:id", protect, admin, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Fetch referred users (Downline)
        const supervisors = await User.findAll({ 
            where: { referedby: user.referalcode, role: 'supervisor' },
            attributes: { exclude: ['password'] }
        });
        const employees = await User.findAll({ 
            where: { referedby: user.referalcode, role: 'employee' },
            attributes: { exclude: ['password'] }
        });
        const customers = await User.findAll({ 
            where: { referedby: user.referalcode, role: 'customer' },
            attributes: { exclude: ['password'] }
        });

        res.json({
            success: true,
            user,
            supervisors,
            employees,
            customers
        });
    } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

