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
        select: ["id", "role", "expoPushToken"] as any,
      });
      const recipientsById = new Map(recipients.map((recipient) => [recipient.id, recipient] as const));
      const tokensByUserId = new Map(
        recipients
          .filter((recipient) => !!recipient.expoPushToken)
          .map((recipient) => [recipient.id, recipient.expoPushToken as string] as const)
      );
      console.info("[Notifications] Recipient token audit:", savedNotifications.map((notif) => {
        const recipient = recipientsById.get(notif.userId);
        const token = recipient?.expoPushToken;
        return {
          notificationId: notif.id,
          recipientUserId: notif.userId,
          recipientRole: recipient?.role ?? "unknown",
          hasToken: !!token,
          tokenFormatValid: !!token && /^(Expo|Exponent)PushToken\[[^\\]]+\]]+$/.test(token),
          channelId: "gasmobil-alerts-v3",
        };
      }));
      const pushMessages = savedNotifications.flatMap((notif) => {
        const to = tokensByUserId.get(notif.userId);
        if (!to || !/^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(to)) return [];
        return [{
          to,
          title: notif.title,
          body: notif.message,
          sound: "default",
          priority: "high",
          channelId: "gasmobil-alerts-v3",
          ttl: 86400,
          data: {
            notificationId: notif.id,
            type: notif.type,
            orderId: notif.orderId,
          },
        }];
      });

      const missingTokens = savedNotifications.length - pushMessages.length;
      console.info("[Notifications] Push dispatch:", {
        saved: savedNotifications.length,
        registeredDeviceTokens: pushMessages.length,
        missingOrInvalidTokens: missingTokens,
      });

      if (pushMessages.length > 0) {
        const ticketResponse = await axios.post(
          "https://exp.host/--/api/v2/push/send",
          pushMessages,
          {
            timeout: 10000,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              ...(process.env.EXPO_ACCESS_TOKEN
                ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
                : {}),
            },
          }
        );
        const tickets = Array.isArray(ticketResponse.data?.data)
          ? ticketResponse.data.data
          : [];
        const ticketErrors = tickets
          .map((ticket: any, index: number) => ({ ticket, index }))
          .filter(({ ticket }: any) => ticket?.status !== "ok");
        console.info("[Notifications] Expo push tickets:", {
          received: tickets.length,
          accepted: tickets.filter((ticket: any) => ticket?.status === "ok").length,
          rejected: ticketErrors.map(({ ticket, index }: any) => ({
            index,
            status: ticket?.status,
            message: ticket?.message,
            details: ticket?.details,
          })),
        });

        // Expo receipts become available shortly after ticket acceptance.
        // Fetch them asynchronously so notification/order API requests are not blocked.
        const receiptIds = tickets
          .filter((ticket: any) => ticket?.status === "ok" && ticket?.id)
          .map((ticket: any) => ticket.id);
        if (receiptIds.length > 0) {
          setTimeout(async () => {
            try {
              const receiptResponse = await axios.post(
                "https://exp.host/--/api/v2/push/getReceipts",
                { ids: receiptIds },
                {
                  timeout: 10000,
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                  },
                }
              );
              const receipts = receiptResponse.data?.data || {};
              const receiptEntries = Object.entries(receipts).map(([id, receipt]: [string, any]) => ({
                id,
                status: receipt?.status,
                message: receipt?.message,
                details: receipt?.details,
              }));
              console.info("[Notifications] Expo delivery receipts:", {
                received: receiptEntries.length,
                delivered: receiptEntries.filter((receipt) => receipt.status === "ok").length,
                errors: receiptEntries.filter((receipt) => receipt.status !== "ok"),
              });
            } catch (receiptError: any) {
              console.error("[Notifications] Expo receipt lookup failed:", receiptError?.response?.data || receiptError?.message || receiptError);
            }
          }, 15000);
        }
      }
    }
  } catch (pushError: any) {
    // Push outages must not make order placement or delivery updates fail.
    console.error("[Notifications] Expo push request failed:", JSON.stringify({
      status: pushError?.response?.status ?? null,
      response: pushError?.response?.data ?? null,
      message: pushError?.message || String(pushError),
      hasExpoAccessToken: Boolean(process.env.EXPO_ACCESS_TOKEN),
    }, null, 2));
  }

  return { sentCount: savedNotifications.length, recipients: Array.from(targetUserIds) };
}