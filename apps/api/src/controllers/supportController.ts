import { Request, Response } from "express";
import { randomUUID } from "crypto";
import AppDataSource from "../config/database";
import { SupportTicket } from "../entities/SupportTicket";
import { User } from "../entities/User";
import { Order } from "../entities/Order";
import { createSystemNotification } from "../services/notificationService";

const repo = () => AppDataSource.getRepository(SupportTicket);
const currentUser = (req: Request) => (req as any).user as User;

export const listTickets = async (req: Request, res: Response) => {
  const user = currentUser(req);
  const where: any = {};
  if (user.role === "customer") where.customerId = user.id;
  else if (user.role === "agent") where.stationId = user.stationId;
  else if (user.role === "driver") where.customerId = user.id;
  const tickets = await repo().find({ where, order: { updatedAt: "DESC" }, take: 100 });
  return res.json({ success: true, data: tickets });
};

export const createTicket = async (req: Request, res: Response) => {
  const user = currentUser(req);
  if (!["customer", "driver"].includes(user.role)) return res.status(403).json({ success: false, error: "Only customers and drivers can open support tickets." });
  const subject = String(req.body?.subject || "").trim().slice(0, 255);
  const description = String(req.body?.message || "").trim().slice(0, 5000);
  if (subject.length < 4 || description.length < 10) return res.status(400).json({ success: false, error: "Enter a subject and a message of at least 10 characters." });
  let stationId: string | null = user.stationId || null;
  if (user.role === "customer") {
    const latestOrder = await AppDataSource.getRepository(Order).findOne({ where: { userId: user.id }, order: { createdAt: "DESC" } });
    stationId = latestOrder?.stationId || null;
  }
  const ticket = repo().create({
    customerId: user.id,
    stationId,
    assignedToId: null,
    subject,
    description,
    status: "open",
    priority: "normal",
    messages: [{ id: randomUUID(), senderId: user.id, senderRole: user.role, message: description, createdAt: new Date().toISOString() }],
  });
  await repo().save(ticket);
  void createSystemNotification({ userId: user.id, stationId: stationId || undefined, type: "system_announcement", title: "New support request", message: `A ${user.role} has opened support ticket: ${subject}`, data: { ticketId: ticket.id }, notifyAdmin: true, notifyAgent: !!stationId });
  return res.status(201).json({ success: true, data: ticket });
};

export const replyTicket = async (req: Request, res: Response) => {
  const user = currentUser(req);
  const message = String(req.body?.message || "").trim().slice(0, 5000);
  if (message.length < 2) return res.status(400).json({ success: false, error: "Enter a reply." });
  const ticket = await repo().findOne({ where: { id: req.params.id } });
  if (!ticket) return res.status(404).json({ success: false, error: "Support ticket not found." });
  if (user.role === "customer" || user.role === "driver") {
    if (ticket.customerId !== user.id) return res.status(404).json({ success: false, error: "Support ticket not found." });
  } else if (user.role === "agent") {
    if (!user.stationId || ticket.stationId !== user.stationId) return res.status(403).json({ success: false, error: "You can only support tickets assigned to your station." });
    ticket.assignedToId = user.id;
  } else if (user.role !== "admin") return res.status(403).json({ success: false, error: "Not authorised." });
  if (["resolved", "closed"].includes(ticket.status) && !["admin", "agent"].includes(user.role)) return res.status(409).json({ success: false, error: "This ticket is closed. Open a new ticket for further help." });
  const messages = ticket.messages || [];
  messages.push({ id: randomUUID(), senderId: user.id, senderRole: user.role, message, createdAt: new Date().toISOString() });
  ticket.messages = messages;
  if (["admin", "agent"].includes(user.role) && ticket.status === "open") ticket.status = "in_progress";
  await repo().save(ticket);
  if (user.role === "admin" || user.role === "agent") {
    const owner = await AppDataSource.getRepository(User).findOne({ where: { id: ticket.customerId } });
    if (owner) void createSystemNotification({ userId: owner.id, type: "system_announcement", title: "Support replied", message: `A GasMobil support agent replied to: ${ticket.subject}`, data: { ticketId: ticket.id }, notifyCustomer: owner.role === "customer", notifyDriver: owner.role === "driver" });
  } else {
    void createSystemNotification({ userId: user.id, stationId: ticket.stationId || undefined, type: "system_announcement", title: "Customer replied to support", message: `A reply was added to: ${ticket.subject}`, data: { ticketId: ticket.id }, notifyAdmin: true, notifyAgent: !!ticket.stationId });
  }
  return res.json({ success: true, data: ticket });
};

export const updateTicket = async (req: Request, res: Response) => {
  const user = currentUser(req);
  if (!["admin", "agent"].includes(user.role)) return res.status(403).json({ success: false, error: "Only support staff can update ticket status." });
  const ticket = await repo().findOne({ where: { id: req.params.id } });
  if (!ticket) return res.status(404).json({ success: false, error: "Support ticket not found." });
  if (user.role === "agent" && (!user.stationId || ticket.stationId !== user.stationId)) return res.status(403).json({ success: false, error: "You can only manage tickets for your station." });
  const status = req.body?.status;
  const priority = req.body?.priority;
  if (status && !["open", "in_progress", "resolved", "closed"].includes(status)) return res.status(400).json({ success: false, error: "Invalid status." });
  if (priority && !["low", "normal", "high", "urgent"].includes(priority)) return res.status(400).json({ success: false, error: "Invalid priority." });
  if (status) ticket.status = status;
  if (priority) ticket.priority = priority;
  if (user.role === "agent") ticket.assignedToId = user.id;
  await repo().save(ticket);
  return res.json({ success: true, data: ticket });
};
