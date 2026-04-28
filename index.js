import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";

import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
// import uploadRoutes from "./routes/uploadRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ↑↑ Increase request body size limit for image uploads
const requestLimit = "50mb";

// ↑↑ Configure CORS with allowed origins
const rawOrigins = process.env.ALLOWED_ORIGINS?.split(",") ?? [];
const allowedOrigins = Array.from(
  new Set(rawOrigins.map((o) => o.trim()).filter(Boolean))
);
if (allowedOrigins.length === 0) allowedOrigins.push("http://localhost:5173");

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no Origin header (e.g., native mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn("Blocked by CORS:", origin);
      // reject request – will result in 403 with proper CORS headers
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);


// Extra security headers (optional but nice to have)
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// ↑↑ Increase body‑parser limits for file uploads
app.use(express.json({ limit: requestLimit }));
app.use(express.urlencoded({ limit: requestLimit, extended: true }));

// ==================== ROUTES ====================
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
// app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
// ==================== END ROUTES ====================

app.get("/", (req, res) => {
  res.send("server running");
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
