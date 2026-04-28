import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  getProductsSearchByString,
  uploadProductImage,
  deleteProductImage
} from "../controllers/productController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get("/getProducts", getProducts);
router.get("/getProductsSearchByString/:searchString", getProductsSearchByString);
router.get("/getProductById/:id", getProductById);
router.post("/createProduct", protect, admin, upload.array('images', 5), createProduct); // Admin only

router.put("/updateProduct/:id", protect, admin, updateProduct);   // Admin only
router.post("/uploadImage/:id", protect, admin, uploadProductImage); // Admin only - accepts JSON with imageUrl
router.delete("/deleteImage/:id", protect, admin, deleteProductImage); // Admin only

export default router;
