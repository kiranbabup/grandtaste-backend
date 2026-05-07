import express from "express";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  clearWishlist,
  getWishlistDetails,
} from "../controllers/wishlistController.js";
import { protect, superAdminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/addToWishlist", protect, addToWishlist);
router.get("/getWishlist", protect, getWishlist);
router.delete("/removeFromWishlist/:productId", protect, removeFromWishlist);
router.delete("/clearWishlist", protect, clearWishlist);

router.get("/getWishlistDetails", protect, superAdminOnly, getWishlistDetails);

export default router;
