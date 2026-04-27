import express from "express";
import { 
  registerUser, 
  loginUser, 
  googleAuth, 
  getUserProfile, 
  updateUserProfile,
  getUsers,
  getUsersByRole,
  getUserByReferalCode,
  getUsersByReferalCode,
  updateUserById,
  getUserbySearchByString
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// Admin / Hierarchy Routes
router.get("/getUsers", protect, getUsers);
router.get("/getUsersByRole/:role", protect, getUsersByRole);
router.get("/getUserbySearchByString/:searchString", protect, getUserbySearchByString);
router.get("/getUserByReferalCode/:referalcode", protect, getUserByReferalCode);
router.get("/getUsersByReferalCode/:referalcode", protect, getUsersByReferalCode);
router.put("/updateUserById/:id", protect, updateUserById);

export default router;