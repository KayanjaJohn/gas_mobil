import { Request, Response } from "express";
import AppDataSource from "../config/database";
import { Notification } from "../entities/Notification";
import { User } from "../entities/User";
import { getIO } from "../config/socket";

const notificationRepo = AppDataSource.getRepository(Notification);
const userRepo = AppDataSource.getRepository(User);

export const broadcastToAllUsers = async (req: Request, res: Response) => {
  try {
    const { title, message, type = 'system_announcement', targetRole = 'customer' } = req.body;
    const { user } = req as any;

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const users = await userRepo.find({
      where: { role: targetRole, isActive: true },
    });

    const notifications = users.map((u) =>
      notificationRepo.create({
        userId: u.id,
        type: type as any,
        title,
        message,
        data: { broadcast: true, sentBy: user.id, targetRole },
        isRead: false,
      })
    );

    await notificationRepo.save(notifications);

    const io = getIO();
    io.emit('system_broadcast', {
      title,
      message,
      type,
      targetRole,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, data: { sentTo: users.length } });
  } catch (error: any) {
    console.error('[broadcastToAllUsers]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};