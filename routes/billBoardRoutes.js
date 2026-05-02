// billBoardRoutes.js

import express from "express";
import {
    createBillBoard,
    getAllBillBoards,
    getBillBoardById,
    getAllBillBoardsAdmin,
    updateBillBoard,
    deleteBillBoard,
} from "../controllers/billBoardController.js";

import {
    protect,
    superAdminOnly,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// PUBLIC APP ROUTES
router.get("/", getAllBillBoards);
router.get("/:id", getBillBoardById);

// SUPERADMIN ROUTES
router.post("/create", protect, superAdminOnly, createBillBoard);
router.get("/admin/all", protect, superAdminOnly, getAllBillBoardsAdmin);
router.put("/update/:id", protect, superAdminOnly, updateBillBoard);
router.delete("/delete/:id", protect, superAdminOnly, deleteBillBoard);

export default router;