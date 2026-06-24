import { Request, Response } from "express";
import AppDataSource from "../config/database";
import { Order } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";
import { Product } from "../entities/Product";
import { Delivery } from "../entities/Delivery";
import { User } from "../entities/User";
import { Station } from "../entities/Station";
import { Wallet } from "../entities/Wallet";
import { Transaction } from "../entities/Transaction";
import { LessThan } from "typeorm";

const orderRepository = AppDataSource.getRepository(Order);
const orderItemRepository = AppDataSource.getRepository(OrderItem);
const productRepository = AppDataSource.getRepository(Product);
const deliveryRepository = AppDataSource.getRepository(Delivery);
const userRepository = AppDataSource.getRepository(User);
const stationRepository = AppDataSource.getRepository(Station);
const walletRepository = AppDataSource.getRepository(Wallet);
const transactionRepository = AppDataSource.getRepository(Transaction);

// Haversine distance calculation
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const createOrder = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { items, deliveryAddress, deliveryCity, deliveryLatitude, deliveryLongitude, paymentMethod, orderType, notes } = req.body;
    const userId = (req as any).userId;

    if (!deliveryAddress) {
      return res.status(400).json({ success: false, error: "Delivery address is required" });
    }

    if (!paymentMethod) {
      return res.status(400).json({ success: false, error: "Payment method is required" });
    }

    // Validate and calculate total
    let totalAmount = 0;
    const orderItems: OrderItem[] = [];
    const stationProducts: Map<string, { product: Product; quantity: number }> = new Map();

    for (const item of items) {
      const productId = item.productId || item.itemId;
      if (!productId) {
        throw new Error(`Product ID missing in item`);
      }

      const product = await queryRunner.manager.findOne(Product, {
        where: { id: productId, isAvailable: true },
        relations: ['station'],
      });

      if (!product) {
        throw new Error(`Product ${productId} not found or unavailable`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Product ${product.name} is out of stock. Available: ${product.stock}`);
      }

      const quantity = item.quantity || 1;
      const subtotal = Number(product.price) * quantity;
      totalAmount += subtotal;

      const orderItem = queryRunner.manager.create(OrderItem, {
        productId: product.id,
        quantity,
        price: product.price,
        subtotal,
      });
      orderItems.push(orderItem);
      stationProducts.set(productId, { product, quantity });
    }

    // Find nearest station
    let station: Station | null = null;
    if (deliveryLatitude && deliveryLongitude) {
      const stations = await queryRunner.manager.find(Station, {
        where: { isActive: true, status: 'active' },
      });

      let minDistance = Infinity;
      for (const s of stations) {
        const dist = calculateDistance(deliveryLatitude, deliveryLongitude, s.latitude, s.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          station = s;
        }
      }
    }

    if (!station) {
      throw new Error("No active station available in your area");
    }

    // Create order
    const order = queryRunner.manager.create(Order, {
      userId,
      totalAmount,
      deliveryAddress,
      deliveryCity,
      deliveryLatitude,
      deliveryLongitude,
      paymentMethod,
      orderType: orderType || 'quick',
      status: 'pending',
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending',
      stationId: station.id,
      notes,
    });

    const savedOrder = await queryRunner.manager.save(order);

    // Save order items and decrement stock
    for (const item of orderItems) {
      item.orderId = savedOrder.id;
      await queryRunner.manager.save(item);

      // Decrement stock
      const { product, quantity } = stationProducts.get(item.productId)!;
      product.stock -= quantity;
      await queryRunner.manager.save(product);
    }

    // Handle wallet payment
    if (paymentMethod === 'wallet') {
      const wallet = await queryRunner.manager.findOne(Wallet, { where: { userId } });
      if (!wallet || Number(wallet.balance) < totalAmount) {
        throw new Error("Insufficient wallet balance");
      }

      wallet.balance = Number(wallet.balance) - totalAmount;
      await queryRunner.manager.save(wallet);

      const transaction = queryRunner.manager.create(Transaction, {
        walletId: wallet.id,
        amount: totalAmount,
        type: 'debit',
        purpose: 'order_payment',
        orderId: savedOrder.id,
        description: `Payment for order ${savedOrder.id}`,
        status: 'completed',
      });
      await queryRunner.manager.save(transaction);

      savedOrder.paymentStatus = 'completed';
      await queryRunner.manager.save(savedOrder);
    }

    // Find and assign driver
    const driver = await queryRunner.manager.findOne(User, {
      where: {
        role: 'driver',
        stationId: station.id,
        driverStatus: 'online',
        isActive: true,
      },
      order: { lastAssignedAt: 'ASC' },
    });

    let delivery: Delivery | null = null;

    if (driver) {
      // Auto-assign driver
      savedOrder.status = 'driver_assigned';
      savedOrder.driverId = driver.id;
      await queryRunner.manager.save(savedOrder);

      driver.driverStatus = 'busy';
      driver.lastAssignedAt = new Date();
      await queryRunner.manager.save(driver);

      const deliveryData: any = {
        orderId: savedOrder.id,
        driverId: driver.id,
        driverName: driver.name,
        driverPhone: driver.phone,
        vehicleNumber: driver.vehicleNumber,
        estimatedArrival: new Date(Date.now() + 30 * 60 * 1000),
        status: 'assigned',
        route: [],
      };

      if (driver.currentLatitude && driver.currentLongitude) {
        deliveryData.currentLocation = {
          latitude: Number(driver.currentLatitude),
          longitude: Number(driver.currentLongitude),
        };
      }

      delivery = queryRunner.manager.create(Delivery, deliveryData);
      await queryRunner.manager.save(delivery);
    } else {
      // Queue for manual assignment
      savedOrder.status = 'pending_assignment';
      await queryRunner.manager.save(savedOrder);

      // TODO: Notify agents at this station
      // await notifyStationAgents(station.id, 'New order needs driver assignment', savedOrder.id);
    }

    await queryRunner.commitTransaction();

    const createdOrder = await orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ["items", "items.product", "deliveries", "station", "driver"],
    });

    res.status(201).json({
      success: true,
      data: {
        order: createdOrder,
        delivery,
        message: driver ? 'Driver assigned automatically' : 'Order queued for driver assignment',
      },
    });
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    console.error("Error creating order:", error);
    res.status(400).json({ success: false, error: error.message || "Failed to create order" });
  } finally {
    await queryRunner.release();
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await orderRepository.findAndCount({
      where: { userId },
      relations: ["items", "items.product", "deliveries", "station"],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;

    const order = await orderRepository.findOne({
      where: { id },
      relations: ["items", "items.product", "deliveries", "station", "driver", "user"],
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Check ownership or admin/driver access
    if (order.userId !== userId && userRole === 'customer') {
      return res.status(403).json({ success: false, error: "Access denied" });
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
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;
    const { reason } = req.body;

    const order = await queryRunner.manager.findOne(Order, {
      where: { id },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Check ownership
    if (order.userId !== userId && !['admin', 'agent'].includes(userRole)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    // Check if can be cancelled
    const nonCancellableStatuses = ['delivered', 'completed', 'cancelled', 'refunded'];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel order with status: ${order.status}`,
      });
    }

    // Return stock
    for (const item of order.items) {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: item.productId },
      });
      if (product) {
        product.stock += item.quantity;
        await queryRunner.manager.save(product);
      }
    }

    // Handle refund for wallet/card payments
    if (order.paymentStatus === 'completed' && ['wallet', 'visa'].includes(order.paymentMethod)) {
      const wallet = await queryRunner.manager.findOne(Wallet, { where: { userId: order.userId } });
      if (wallet) {
        wallet.balance = Number(wallet.balance) + Number(order.totalAmount);
        await queryRunner.manager.save(wallet);

        const transaction = queryRunner.manager.create(Transaction, {
          walletId: wallet.id,
          amount: order.totalAmount,
          type: 'credit',
          purpose: 'refund',
          orderId: order.id,
          description: `Refund for cancelled order ${order.id}`,
          status: 'completed',
        });
        await queryRunner.manager.save(transaction);
      }

      order.paymentStatus = 'refunded';
    }

    // If driver was assigned, free them up
    if (order.driverId) {
      const driver = await queryRunner.manager.findOne(User, { where: { id: order.driverId } });
      if (driver) {
        driver.driverStatus = 'online';
        await queryRunner.manager.save(driver);
      }

      // Cancel delivery
      const delivery = await queryRunner.manager.findOne(Delivery, { where: { orderId: order.id } });
      if (delivery) {
        delivery.status = 'cancelled';
        await queryRunner.manager.save(delivery);
      }
    }

    order.status = 'cancelled';
    order.cancellationReason = reason || 'User cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = userId;

    await queryRunner.manager.save(order);
    await queryRunner.commitTransaction();

    res.json({
      success: true,
      data: order,
      message: "Order cancelled successfully",
    });
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await queryRunner.release();
  }
};