import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Order } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";
import { Product } from "../entities/Product";
import { Delivery } from "../entities/Delivery";

const orderRepository = AppDataSource.getRepository(Order);
const orderItemRepository = AppDataSource.getRepository(OrderItem);
const productRepository = AppDataSource.getRepository(Product);
const deliveryRepository = AppDataSource.getRepository(Delivery);

export const createOrder = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { items, deliveryAddress, deliveryCity, deliveryLatitude, deliveryLongitude, notes, paymentMethod, orderType } = req.body;
    const userId = (req as any).userId || process.env.DEMO_USER_ID || "demo-user";

    if (!deliveryAddress) {
      return res.status(400).json({ success: false, error: "Delivery address is required" });
    }

    if (!paymentMethod) {
      return res.status(400).json({ success: false, error: "Payment method is required" });
    }

    let totalAmount = 0;
    const orderItems: OrderItem[] = [];

    // Create order items and calculate total
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        // Support both itemId and productId from mobile
        const productId = item.productId || item.itemId;

        if (!productId) {
          throw new Error(`Product ID missing in item: ${JSON.stringify(item)}`);
        }

        const product = await queryRunner.manager.findOne(Product, { where: { id: productId } });
        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }

        const quantity = item.quantity || 1;
        const subtotal = Number(product.price) * quantity;
        totalAmount += subtotal;

        const orderItem = queryRunner.manager.create(OrderItem, {
          productId: product.id,
          quantity: quantity,
          price: product.price,
          subtotal,
        });
        orderItems.push(orderItem);
      }
    }

    // Create order
    const order = queryRunner.manager.create(Order, {
      userId,
      totalAmount,
      deliveryAddress,
      deliveryCity,
      deliveryLatitude,
      deliveryLongitude,
      notes,
      paymentMethod,
      orderType,
      status: "pending",
    });

    const savedOrder = await queryRunner.manager.save(order);

    // Save order items with orderId
    for (const item of orderItems) {
      item.orderId = savedOrder.id;
      await queryRunner.manager.save(item);
    }

    // Create delivery
    const delivery = queryRunner.manager.create(Delivery, {
      orderId: savedOrder.id,
      driverId: "demo-driver",
      driverName: "Moses K.",
      driverPhone: "+256700000000",
      vehicleNumber: "UAX 234B",
      currentLocation: {
        latitude: 0.3476,
        longitude: 32.5825,
      },
      estimatedArrival: new Date(Date.now() + 30 * 60 * 1000),
      status: "assigned",
      route: [{ latitude: 0.3476, longitude: 32.5825 }],
    });

    await queryRunner.manager.save(delivery);
    await queryRunner.commitTransaction();

    const createdOrder = await orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ["items", "items.product", "deliveries"],
    });

    res.status(201).json({
      success: true,
      data: {
        order: createdOrder,
        delivery,
      },
    });
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await queryRunner.release();
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || process.env.DEMO_USER_ID || "demo-user";
    const orders = await orderRepository.find({
      where: { userId },
      relations: ["items", "items.product"],
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await orderRepository.findOne({
      where: { id },
      relations: ["items", "items.product", "deliveries"],
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await orderRepository.findOne({ where: { id } });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    order.status = "cancelled";
    await orderRepository.save(order);

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};