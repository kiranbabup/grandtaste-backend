import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/addToCart", protect, addToCart);
router.get("/getCart", protect, getCart);
router.delete("/removeFromCart/:productId", protect, removeFromCart);
router.delete("/clearCart", protect, clearCart);

export default router;