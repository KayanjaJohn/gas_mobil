import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  registerPushToken,
  unregisterPushToken,
} from "../controllers/notificationController";

const router = Router();

router.post("/push-token", authMiddleware, registerPushToken);
router.delete("/push-token", authMiddleware, unregisterPushToken);
router.get("/", authMiddleware, getNotifications);
router.patch("/:id/read", authMiddleware, markAsRead);
router.patch("/read-all", authMiddleware, markAllAsRead);
router.delete("/:id", authMiddleware, deleteNotification);

export default router;