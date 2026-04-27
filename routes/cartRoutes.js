import express from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/getCart", protect, getCart);
router.post("/addToCart", protect, addToCart);
router.delete("/removeFromCart/:productId", protect, removeFromCart);
router.delete("/clearCart", protect, clearCart);

export default router;