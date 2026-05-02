// billBoardController.js

import BillBoards from "../models/bill_board_model.js";

// SUPERADMIN CREATE
export const createBillBoard = async (req, res) => {
    try {
        const {
            title,
            message,
            image,
            url,
            status,
        } = req.body;

        if (!title || !image) {
            return res.status(400).json({
                message: "Title and image are required",
            });
        }

        const billBoard = await BillBoards.create({
            title,
            message,
            image,
            url,
            status: status ?? 1,
        });

        return res.status(201).json({
            message: "Billboard created successfully",
            billBoard,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to create billboard",
            error: error.message,
        });
    }
};

// PUBLIC GET ALL ACTIVE
export const getAllBillBoards = async (req, res) => {
    try {
        const billBoards = await BillBoards.findAll({
            where: { status: 1 },
            order: [["createdAt", "DESC"]],
        });

        return res.json(billBoards);

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch billboards",
            error: error.message,
        });
    }
};

// PUBLIC GET BY ID
export const getBillBoardById = async (req, res) => {
    try {
        const billBoard = await BillBoards.findByPk(req.params.id);

        if (!billBoard || billBoard.status !== 1) {
            return res.status(404).json({
                message: "Billboard not found",
            });
        }

        return res.json(billBoard);

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch billboard",
            error: error.message,
        });
    }
};

// SUPERADMIN GET ALL
export const getAllBillBoardsAdmin = async (req, res) => {
    try {
        const billBoards = await BillBoards.findAll({
            order: [["createdAt", "DESC"]],
        });

        return res.json(billBoards);

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch admin billboards",
            error: error.message,
        });
    }
};

// SUPERADMIN UPDATE
export const updateBillBoard = async (req, res) => {
    try {
        const { id } = req.params;

        const billBoard = await BillBoards.findByPk(id);

        if (!billBoard) {
            return res.status(404).json({
                message: "Billboard not found",
            });
        }

        const {
            title,
            message,
            image,
            url,
            status,
        } = req.body;

        await billBoard.update({
            title: title ?? billBoard.title,
            message: message ?? billBoard.message,
            image: image ?? billBoard.image,
            url: url ?? billBoard.url,
            status: status ?? billBoard.status,
            updatedAt: new Date().toISOString(),
        });

        return res.json({
            message: "Billboard updated successfully",
            billBoard,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to update billboard",
            error: error.message,
        });
    }
};

// SUPERADMIN DELETE
export const deleteBillBoard = async (req, res) => {
    try {
        const { id } = req.params;

        const billBoard = await BillBoards.findByPk(id);

        if (!billBoard) {
            return res.status(404).json({
                message: "Billboard not found",
            });
        }

        await billBoard.destroy();

        return res.json({
            message: "Billboard deleted successfully",
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to delete billboard",
            error: error.message,
        });
    }
};