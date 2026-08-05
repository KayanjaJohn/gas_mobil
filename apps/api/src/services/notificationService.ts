import AppDataSource from '../config/database';
import { Notification, NotificationType } from '../entities/Notification';
import { User } from '../entities/User';
import { broadcastToUser, broadcastToAdmins } from '../config/socket';

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

  // 1. ALL admins receive EVERY activity when notifyAdmin is true
  if (payload.notifyAdmin) {
    const admins = await userRepo.find({ where: { role: 'admin', isActive: true } });
    for (const admin of admins) {
      if (!targetUserIds.has(admin.id)) {
        targetUserIds.add(admin.id);
        notificationsToSave.push(
          notificationRepo.create({
            userId: admin.id,
            type: payload.type,
            orderId: payload.orderId || null,
            title: `[ADMIN] ${payload.title}`,
            message: payload.message,
            data: { ...payload.data, scope: 'admin' },
            isRead: false,
          })
        );
      }
    }
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
            userId: agent.id,
            type: payload.type,
            orderId: payload.orderId || null,
            title: `[STATION] ${payload.title}`,
            message: payload.message,
            data: { ...payload.data, scope: 'agent', stationId: payload.stationId },
            isRead: false,
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
          userId: payload.userId,
          type: payload.type,
          orderId: payload.orderId || null,
          title: payload.title,
          message: payload.message,
          data: { ...payload.data, scope: 'customer' },
          isRead: false,
        })
      );
      broadcastToUser(payload.userId, 'notification', {
        type: payload.type,
        title: payload.title,
        message: payload.message,
        orderId: payload.orderId,
        data: payload.data,
      });
    }
  }

  // 4. Specific driver
  if (payload.notifyDriver && payload.userId) {
    if (!targetUserIds.has(payload.userId)) {
      targetUserIds.add(payload.userId);
      notificationsToSave.push(
        notificationRepo.create({
          userId: payload.userId,
          type: payload.type,
          orderId: payload.orderId || null,
          title: payload.title,
          message: payload.message,
          data: { ...payload.data, scope: 'driver' },
          isRead: false,
        })
      );
      broadcastToUser(payload.userId, 'notification', {
        type: payload.type,
        title: payload.title,
        message: payload.message,
        orderId: payload.orderId,
        data: payload.data,
      });
    }
  }

  if (notificationsToSave.length > 0) {
    await notificationRepo.save(notificationsToSave);
  }

  return { sentCount: notificationsToSave.length, recipients: Array.from(targetUserIds) };
}