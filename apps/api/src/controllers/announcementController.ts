import { Request, Response } from "express";
import { sendGlobalAnnouncement } from "../services/announcementService";

export const createGlobalAnnouncement = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user?.role !== "admin") {
      return res.status(403).json({ success: false, error: "Only administrators can send global announcements." });
    }

    const title = String(req.body?.title || "").trim();
    const message = String(req.body?.message || "").trim();
    const sendPush = req.body?.sendPush !== false;
    const sendEmail = req.body?.sendEmail !== false;

    if (title.length < 4 || title.length > 160) {
      return res.status(400).json({ success: false, error: "Title must be between 4 and 160 characters." });
    }
    if (message.length < 10 || message.length > 10000) {
      return res.status(400).json({ success: false, error: "Message must be between 10 and 10,000 characters." });
    }
    if (!sendPush && !sendEmail) {
      return res.status(400).json({ success: false, error: "Choose at least one delivery channel." });
    }

    const result = await sendGlobalAnnouncement({ title, message, sendPush, sendEmail });
    return res.status(200).json({
      success: true,
      data: result,
      message: `Announcement processed for ${result.recipientCount} active GasMobil users.`,
    });
  } catch (error) {
    console.error("[GlobalAnnouncement] Failed:", error);
    return res.status(500).json({ success: false, error: "The announcement could not be processed." });
  }
};
