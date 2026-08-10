import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// MEDIUM FIX: Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: { success: false, error: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Too many attempts. Please try again later." },
});

// Public routes
router.post("/register", authLimiter, authController.register);
router.post("/login", strictLimiter, authController.login);
router.post("/refresh", authLimiter, authController.refreshToken);
router.post("/forgot-password", strictLimiter, authController.forgotPassword);
router.post("/reset-password", strictLimiter, authController.resetPassword);

// Protected routes
router.get("/verify", authMiddleware, authController.verifyToken);
router.get("/me", authMiddleware, authController.getCurrentUser);
router.put("/profile", authMiddleware, authController.updateProfile);
router.put("/change-password", authMiddleware, authController.changePassword);

export default router;