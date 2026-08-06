import AppDataSource from '../config/database';
import { Notification, NotificationType } from '../entities/Notification';
import { User } from '../entities/User';
import { broadcastToUser, broadcastToAdmins, broadcastToStation } from '../config/socket';

const notificationRepo = AppDataSource.getRepository(Notification);
const userRepo = AppDataSource.getRepository(User);

export interface NotifyPayload {
  userId?: string;
  stationId?: string;
  type: NotificationType;
  orderId?: string | null;
  title: string;
  message: string;
  data?: any;
  notifyAdmin?: boolean;
  notifyAgent?: boolean;
  notifyCustomer?: boolean;
  notifyDriver?: boolean;
}

export async function createSystemNotification(payload: NotifyPayload) {
  const notificationsToSave: Notification[] = [];
  const targetUserIds = new Set<string>();
  const socketPayloads: Array<{ userId: string; event: string; data: any }> = [];

  const basePayload = {
    type: payload.type,
    orderId: payload.orderId || null,
    title: payload.title,
    message: payload.message,
    data: payload.data,
    isRead: false,
  };

  // 1. ALL admins receive EVERY activity when notifyAdmin is true
  if (payload.notifyAdmin) {
    const admins = await userRepo.find({ where: { role: 'admin', isActive: true } });
    for (const admin of admins) {
      if (!targetUserIds.has(admin.id)) {
        targetUserIds.add(admin.id);
        notificationsToSave.push(
          notificationRepo.create({
            ...basePayload,
            userId: admin.id,
            title: `[ADMIN] ${payload.title}`,
            data: { ...payload.data, scope: 'admin' },
          })
        );
      }
    }
    // Admin socket broadcast (no ID needed — just an alert)
    broadcastToAdmins('admin_notification', {
      type: payload.type,
      title: payload.title,
      message: payload.message,
      orderId: payload.orderId,
      data: payload.data,
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Agents at the specific station
  if (payload.notifyAgent && payload.stationId) {
    const agents = await userRepo.find({
      where: { role: 'agent', stationId: payload.stationId, isActive: true },
    });
    for (const agent of agents) {
      if (!targetUserIds.has(agent.id)) {
        targetUserIds.add(agent.id);
        notificationsToSave.push(
          notificationRepo.create({
            ...basePayload,
            userId: agent.id,
            title: `[STATION] ${payload.title}`,
            data: { ...payload.data, scope: 'agent', stationId: payload.stationId },
          })
        );
      }
    }
  }

  // 3. Specific customer
  if (payload.notifyCustomer && payload.userId) {
    if (!targetUserIds.has(payload.userId)) {
      targetUserIds.add(payload.userId);
      notificationsToSave.push(
        notificationRepo.create({
          ...basePayload,
          userId: payload.userId,
          data: { ...payload.data, scope: 'customer' },
        })
      );
    }
  }

  // 4. Specific driver
  if (payload.notifyDriver && payload.userId) {
    if (!targetUserIds.has(payload.userId)) {
      targetUserIds.add(payload.userId);
      notificationsToSave.push(
        notificationRepo.create({
          ...basePayload,
          userId: payload.userId,
          data: { ...payload.data, scope: 'driver' },
        })
      );
    }
  }

  // ── CRITICAL FIX: Save FIRST, then emit with REAL IDs ──
  let savedNotifications: Notification[] = [];
  if (notificationsToSave.length > 0) {
    savedNotifications = await notificationRepo.save(notificationsToSave);
  }

  // Emit to individual users with their real DB notification IDs
  for (const notif of savedNotifications) {
    const scope = notif.data?.scope;
    if (scope === 'customer' || scope === 'driver') {
      broadcastToUser(notif.userId, 'notification', {
        id: notif.id,                 // ← REAL ID from DB
        type: notif.type,
        title: notif.title,
        message: notif.message,
        orderId: notif.orderId,
        data: notif.data,
        isRead: false,
        createdAt: notif.createdAt,
      });
    }
  }

  return { sentCount: savedNotifications.length, recipients: Array.from(targetUserIds) };
}