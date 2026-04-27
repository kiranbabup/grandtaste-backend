import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/getWishlist", protect, getWishlist);
router.post("/addToWishlist", protect, addToWishlist);
router.delete("/removeFromWishlist/:productId", protect, removeFromWishlist);
router.delete("/clearWishlist", protect, clearWishlist);

export default router;
