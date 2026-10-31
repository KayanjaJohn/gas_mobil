import { Request, Response } from "express";
import AppDataSource from "../config/database";
import { Order } from "../entities/Order";
import { createSystemNotification } from "../services/notificationService";

const orderRepository = AppDataSource.getRepository(Order);

const onlinePaymentsDisabled = (_req: Request, res: Response) =>
  res.status(503).json({
    success: false,
    error: "Online payments are disabled. Please select cash on delivery.",
  });

export const initiateMobilePayment = onlinePaymentsDisabled;
export const checkPaymentStatus = onlinePaymentsDisabled;
export const payWithWallet = onlinePaymentsDisabled;
export const initiateCardPayment = onlinePaymentsDisabled;
export const momoCallback = onlinePaymentsDisabled;
export const airtelCallback = onlinePaymentsDisabled;

export const stripeWebhook = (_req: Request, res: Response) =>
  res.status(503).json({
    success: false,
    error: "Online payments are disabled.",
  });

export const markCashOnDelivery = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const user = (req as any).user;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Order ID is required.",
      });
    }

    const order = await orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found.",
      });
    }

    if (order.userId !== user.id && !["admin", "agent"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "Access denied.",
      });
    }

    order.paymentMethod = "cash";
    order.paymentStatus = "pending";
    await orderRepository.save(order);

    await createSystemNotification({
      type: "order_placed",
      orderId: order.id,
      stationId: order.stationId,
      title: "Cash on Delivery",
      message: `Order #${order.id.slice(0, 8).toUpperCase()} is set for cash payment on delivery.`,
      data: { method: "cash", amount: order.totalAmount },
      notifyAdmin: true,
      notifyAgent: true,
      notifyCustomer: true,
      userId: order.userId,
    });

    return res.json({
      success: true,
      data: {
        orderId: order.id,
        paymentMethod: "cash",
        paymentStatus: order.paymentStatus,
        message: "Please pay the driver when your order is delivered.",
      },
    });
  } catch (error: any) {
    console.error("Cash-on-delivery error:", error);
    return res.status(500).json({
      success: false,
      error: "Unable to set cash on delivery.",
    });
  }
};
