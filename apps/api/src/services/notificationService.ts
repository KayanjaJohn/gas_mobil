import axios from 'axios';
import AppDataSource from '../config/database';
import { Notification, NotificationType } from '../entities/Notification';
import { User } from '../entities/User';
import { broadcastToUser } from '../config/socket';

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

  // Emit every persisted notification to its recipient with the real DB ID.
  // This is shared by customer, driver, agent, and admin clients.
  for (const notif of savedNotifications) {
    broadcastToUser(notif.userId, 'notification', {
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      orderId: notif.orderId,
      data: notif.data,
      isRead: false,
      createdAt: notif.createdAt,
    });
  }

  // Push notifications reach mobile devices even when the app is backgrounded
  // or closed. Socket delivery above remains the immediate in-app path.
  try {
    const recipientIds = Array.from(new Set(savedNotifications.map((item) => item.userId)));
    if (recipientIds.length > 0) {
      const recipients = await userRepo.find({
        where: recipientIds.map((id) => ({ id })),
        select: ["id", "expoPushToken"] as any,
      });
      const tokensByUserId = new Map(
        recipients
          .filter((recipient) => !!recipient.expoPushToken)
          .map((recipient) => [recipient.id, recipient.expoPushToken as string] as const)
      );
      const pushMessages = savedNotifications.flatMap((notif) => {
        const to = tokensByUserId.get(notif.userId);
        if (!to || !/^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(to)) return [];
        return [{
          to,
          title: notif.title,
          body: notif.message,
          sound: "default",
          priority: "high",
          channelId: "default",
          ttl: 86400,
          data: {
            notificationId: notif.id,
            type: notif.type,
            orderId: notif.orderId,
          },
        }];
      });

      if (pushMessages.length > 0) {
        await axios.post(
          "https://exp.host/--/api/v2/push/send",
          pushMessages,
          {
            timeout: 5000,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );
      }
    }
  } catch (pushError: any) {
    // Push outages must not make order placement or delivery updates fail.
    console.warn("[Notifications] Expo push delivery failed:", pushError?.message || pushError);
  }

  return { sentCount: savedNotifications.length, recipients: Array.from(targetUserIds) };
}