import express from "express";
import multer from "multer";
import {
  createProduct,
  deleteProductImage,
  getAllProducts,
  getAllProductsAdmin,
  getProductDetailsById,
  getProductsSearchByString,
  getProductsSearchByStringAdmin,
  updateProduct,
  uploadProductImage,
} from "../controllers/productController.js";
import { protect, superAdminOnly, } from "../middleware/authMiddleware.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024, }, });

// PUBLIC
router.get("/getallproducts", getAllProducts);
router.get("/search/:searchString", getProductsSearchByString);
router.get("/getProductByid/:id", getProductDetailsById);

// SUPERADMIN
router.post("/create", protect, superAdminOnly, upload.array("images", 10), createProduct);
router.get("/admin/all", protect, superAdminOnly, getAllProductsAdmin);
router.get("/admin/search/:searchString", protect, superAdminOnly, getProductsSearchByStringAdmin);

router.put("/update/:id", protect, superAdminOnly, updateProduct);
router.post("/uploadImage/:id", protect, superAdminOnly, uploadProductImage);
router.delete("/deleteImage/:id", protect, superAdminOnly, deleteProductImage);

export default router;
