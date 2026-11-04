import { Request, Response } from "express";
import AppDataSource from "../config/database";
import { Notification } from "../entities/Notification";
import { User } from "../entities/User";

const notificationRepo = AppDataSource.getRepository(Notification);
const userRepo = AppDataSource.getRepository(User);

// POST /api/notifications/push-token — Save this authenticated device's Expo token.
export const registerPushToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const expoPushToken = String(req.body?.expoPushToken || "").trim();

    if (!/^(Expo|Exponent)PushToken\\[[^\\]]+\\]$/.test(expoPushToken)) {
      return res.status(400).json({ success: false, error: "A valid Expo push token is required." });
    }

    await userRepo.update({ id: userId }, { expoPushToken });
    return res.json({ success: true, message: "Device notification token registered." });
  } catch (error: any) {
    console.error("[PUSH TOKEN] Registration failed:", error);
    return res.status(500).json({ success: false, error: "Could not register this device for notifications." });
  }
};

// GET /api/notifications — Get user's notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [notifications, total] = await notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = await notificationRepo.count({
      where: { userId, isRead: false },
    });

    res.json({
      success: true,
      data: notifications,
      meta: { total, page, limit, unreadCount },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/notifications/:id/read — Mark single as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const notification = await notificationRepo.findOne({ where: { id, userId } });
    if (!notification) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    notification.isRead = true;
    await notificationRepo.save(notification);

    res.json({ success: true, data: notification });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/notifications/read-all — Mark all as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await notificationRepo.update({ userId, isRead: false }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/notifications/:id — Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const result = await notificationRepo.delete({ id, userId });
    if (result.affected === 0) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    res.json({ success: true, message: "Notification deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};