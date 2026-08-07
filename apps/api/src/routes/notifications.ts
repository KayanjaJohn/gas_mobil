import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController";

const router = Router();

router.get("/", authMiddleware, getNotifications);
router.patch("/:id/read", authMiddleware, markAsRead);
router.patch("/read-all", authMiddleware, markAllAsRead);
router.delete("/:id", authMiddleware, deleteNotification);

export default router;