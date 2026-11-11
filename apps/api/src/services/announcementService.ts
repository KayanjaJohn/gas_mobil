import axios from "axios";
import nodemailer from "nodemailer";
import AppDataSource from "../config/database";
import { Notification } from "../entities/Notification";
import { User } from "../entities/User";
import { broadcastToUser } from "../config/socket";

export interface GlobalAnnouncementInput {
  title: string;
  message: string;
  sendPush: boolean;
  sendEmail: boolean;
}

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

export async function sendGlobalAnnouncement(input: GlobalAnnouncementInput) {
  const users = await AppDataSource.getRepository(User).find({
    where: { isActive: true },
    select: ["id", "name", "email", "role", "expoPushToken"],
  } as any);

  const notifications = users.map((user) => AppDataSource.getRepository(Notification).create({
    userId: user.id,
    type: "system_announcement",
    orderId: null,
    title: input.title,
    message: input.message,
    data: { scope: "global", sender: "info@gas-mobil.com" },
    isRead: false,
  }));
  const saved = notifications.length
    ? await AppDataSource.getRepository(Notification).save(notifications)
    : [];

  saved.forEach((notification) => {
    broadcastToUser(notification.userId, "notification", {
      id: notification.id, type: notification.type, title: notification.title,
      message: notification.message, orderId: null, data: notification.data,
      isRead: false, createdAt: notification.createdAt,
    });
  });

  let pushAccepted = 0;
  let pushSkipped = 0;
  let pushErrors = 0;
  if (input.sendPush) {
    const pushMessages = saved.flatMap((notification) => {
      const user = users.find((candidate) => candidate.id === notification.userId);
      const token = user?.expoPushToken || "";
      if (!/^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(token)) {
        pushSkipped += 1;
        return [];
      }
      return [{
        to: token, title: input.title, body: input.message, sound: "default",
        priority: "high", channelId: "gasmobil-alerts-v5", ttl: 86400,
        data: { notificationId: notification.id, type: "system_announcement", scope: "global" },
      }];
    });
    for (let index = 0; index < pushMessages.length; index += 100) {
      try {
        const response = await axios.post("https://exp.host/--/api/v2/push/send",
          pushMessages.slice(index, index + 100), {
            timeout: 15000,
            headers: {
              Accept: "application/json", "Content-Type": "application/json",
              ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
            },
          });
        const tickets = Array.isArray(response.data?.data) ? response.data.data : [];
        pushAccepted += tickets.filter((ticket: any) => ticket?.status === "ok").length;
        pushErrors += tickets.filter((ticket: any) => ticket?.status !== "ok").length;
      } catch (error) {
        pushErrors += pushMessages.slice(index, index + 100).length;
        console.error("[GlobalAnnouncement] Push batch failed:", error);
      }
    }
  }

  let emailSent = 0;
  let emailFailed = 0;
  let emailSkipped = 0;
  if (input.sendEmail) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const recipients = [...new Set(users.map((user) => user.email).filter((email) => !!email))];
    if (!host || !smtpUser || !smtpPass || !Number.isFinite(port)) {
      emailSkipped = recipients.length;
    } else {
      const transporter = nodemailer.createTransport({
        host, port, secure: port === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      const html = `<!doctype html><html><body style="margin:0;background:#f5f3ed;padding:28px;font-family:Arial,sans-serif;color:#183529"><div style="max-width:620px;margin:auto;background:#fff;border-radius:14px;overflow:hidden"><div style="background:#064b2d;padding:22px 28px;color:#fff"><strong style="font-size:22px">GasMobil</strong><div style="font-size:12px;margin-top:5px">Official user announcement</div></div><div style="padding:28px"><h2 style="margin-top:0">${escapeHtml(input.title)}</h2><p style="white-space:pre-wrap;line-height:1.65">${escapeHtml(input.message)}</p><hr style="border:0;border-top:1px solid #e5e7eb;margin:26px 0"><p style="font-size:12px;color:#66756b">This official update was sent by GasMobil Uganda from <a href="mailto:info@gas-mobil.com">info@gas-mobil.com</a>.</p></div></div></body></html>`;
      for (let index = 0; index < recipients.length; index += 40) {
        const batch = recipients.slice(index, index + 40);
        try {
          const result = await transporter.sendMail({
            from: '"GasMobil" <info@gas-mobil.com>',
            to: "info@gas-mobil.com",
            bcc: batch,
            subject: input.title,
            text: `${input.title}\n\n${input.message}\n\nGasMobil Uganda | info@gas-mobil.com`,
            html,
          });
          emailSent += Array.isArray(result.accepted) ? result.accepted.length : batch.length;
          emailFailed += Array.isArray(result.rejected) ? result.rejected.length : 0;
        } catch (error) {
          emailFailed += batch.length;
          console.error("[GlobalAnnouncement] Email batch failed:", error);
        }
      }
    }
  }

  return {
    recipientCount: users.length,
    inAppNotifications: saved.length,
    push: input.sendPush ? { accepted: pushAccepted, skippedNoToken: pushSkipped, failed: pushErrors } : null,
    email: input.sendEmail ? { sent: emailSent, skipped: emailSkipped, failed: emailFailed } : null,
  };
}
