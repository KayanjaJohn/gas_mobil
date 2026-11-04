import { Request, Response } from "express";
import AppDataSource from "../config/database";
import { ProductCatalog } from "../entities/ProductCatalog";
import { Product } from "../entities/Product";
import { Station } from "../entities/Station";
import { User } from "../entities/User";
import { createSystemNotification } from "../services/notificationService";
import { getIO } from "../config/socket";
import { recordStationActivity } from "../services/stationActivityService";

const catalogRepo = AppDataSource.getRepository(ProductCatalog);
const productRepo = AppDataSource.getRepository(Product);

export const getCatalog = async (req: Request, res: Response) => {
  try {
    const items = await catalogRepo.find({ where: { isActive: true } });
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createCatalogItem = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin access only" });
    }
    const { name, description, defaultPrice, defaultWeight, defaultSize, category, imageUrl } = req.body;
    if (!name || !defaultPrice) {
      return res.status(400).json({ success: false, error: "Name and defaultPrice are required" });
    }
    const item = catalogRepo.create({
      name, description, defaultPrice, defaultWeight, defaultSize,
      category: category || "cylinder", imageUrl, isActive: true,
    });
    await catalogRepo.save(item);
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCatalogItem = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin access only" });
    }
    const { id } = req.params;
    const item = await catalogRepo.findOne({ where: { id } });
    if (!item) {
      return res.status(404).json({ success: false, error: "Catalog item not found" });
    }
    const { name, description, defaultPrice, defaultWeight, defaultSize, category, imageUrl, isActive } = req.body;
    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (defaultPrice !== undefined) item.defaultPrice = defaultPrice;
    if (defaultWeight !== undefined) item.defaultWeight = defaultWeight;
    if (defaultSize !== undefined) item.defaultSize = defaultSize;
    if (category !== undefined) item.category = category;
    if (imageUrl !== undefined) item.imageUrl = imageUrl;
    if (isActive !== undefined) item.isActive = isActive;
    await catalogRepo.save(item);
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteCatalogItem = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin access only" });
    }
    const { id } = req.params;
    const item = await catalogRepo.findOne({ where: { id } });
    if (!item) {
      return res.status(404).json({ success: false, error: "Catalog item not found" });
    }
    item.isActive = false;
    await catalogRepo.save(item);
    res.json({ success: true, message: "Catalog item deactivated" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addCatalogToStation = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (!["admin", "agent"].includes(user.role)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    const { id } = req.params;
    const { stationId, price, stock, imageUrl } = req.body;
    const targetStationId = stationId || user.stationId;
    if (!targetStationId) {
      return res.status(400).json({ success: false, error: "Station ID required" });
    }
    const catalogItem = await catalogRepo.findOne({ where: { id, isActive: true } });
    if (!catalogItem) {
      return res.status(404).json({ success: false, error: "Catalog item not found" });
    }
    if (user.role === "agent" && user.stationId !== targetStationId) {
      return res.status(403).json({ success: false, error: "Agents can only update their own station stock." });
    }

    const restockQuantity = Math.max(0, Math.floor(Number(stock ?? 0)));
    if (!Number.isFinite(restockQuantity)) {
      return res.status(400).json({ success: false, error: "Stock quantity must be a valid non-negative number." });
    }

    const existing = await productRepo
      .createQueryBuilder("product")
      .where("LOWER(product.name) = LOWER(:name)", { name: catalogItem.name })
      .andWhere("product.stationId = :stationId", { stationId: targetStationId })
      .getOne();

    let product: Product;
    if (existing) {
      existing.stock = Math.max(0, Number(existing.stock || 0)) + restockQuantity;
      if (price !== undefined && Number.isFinite(Number(price))) existing.price = Number(price);
      if (imageUrl) existing.imageUrl = imageUrl;
      existing.isAvailable = existing.stock > 0;
      product = await productRepo.save(existing);
    } else {
      product = productRepo.create({
        name: catalogItem.name,
        description: catalogItem.description,
        price: price !== undefined ? price : catalogItem.defaultPrice,
        stock: restockQuantity,
        weight: catalogItem.defaultWeight,
        size: catalogItem.defaultSize,
        type: catalogItem.category,
        imageUrl: imageUrl || catalogItem.imageUrl,
        isAvailable: restockQuantity > 0,
        stationId: targetStationId,
      });
      product = await productRepo.save(product);
    }

    const station = await AppDataSource.getRepository(Station).findOne({
      where: { id: targetStationId },
    });
    if (restockQuantity > 0) {
      await recordStationActivity({
        stationId: targetStationId,
        eventType: existing ? "stock_replenished" : "product_added",
        title: existing ? "Station stock replenished" : "Product added to station",
        description: `${catalogItem.name}: +${restockQuantity} unit(s). Available stock: ${product.stock}.`,
        actorId: user.id,
        data: {
          productId: product.id,
          productName: product.name,
          addedQuantity: restockQuantity,
          availableStock: product.stock,
          unitPrice: product.price,
        },
      });
    }
    const io = getIO();
    io.to(`station_${targetStationId}`).emit(existing ? "product_updated" : "product_created", product);
    io.emit("product_updated", { type: existing ? "restocked" : "created", product });

    if (restockQuantity > 0) {
      // Durable station-level notification: all active agents at this station
      // see it in their notification centre even if they were offline.
      await createSystemNotification({
        type: "system_announcement",
        stationId: targetStationId,
        title: existing ? "Station Stock Replenished" : "New Station Stock Added",
        message: `${catalogItem.name}: ${restockQuantity} unit(s) added at ${station?.name || "your station"}. New available stock: ${product.stock}.`,
        data: {
          event: "station_stock_restocked",
          stationId: targetStationId,
          stationName: station?.name,
          productId: product.id,
          productName: product.name,
          addedQuantity: restockQuantity,
          availableStock: product.stock,
        },
        notifyAdmin: true,
        notifyAgent: true,
      });

      // Notify customers with a saved GPS location near this station.
      // 15 km is a practical nearby-station alert radius; it is not a delivery radius.
      if (station) {
        const customers = await AppDataSource.getRepository(User).find({
          where: { role: "customer", isActive: true } as any,
          select: ["id", "latitude", "longitude", "city"] as any,
        });
        const toRadians = (value: number) => value * Math.PI / 180;
        const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const dLat = toRadians(lat2 - lat1);
          const dLon = toRadians(lon2 - lon1);
          const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
          return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };
        const nearbyCustomers = customers.filter((customer) => {
          const latitude = Number(customer.latitude);
          const longitude = Number(customer.longitude);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
              latitude === 0 && longitude === 0) return false;
          return distanceKm(
            latitude, longitude, Number(station.latitude), Number(station.longitude)
          ) <= 15;
        });
        await Promise.all(nearbyCustomers.map((customer) =>
          createSystemNotification({
            type: "system_announcement",
            userId: customer.id,
            title: "Gas Stock Available Near You",
            message: `${catalogItem.name} is now available at ${station.name}. You can select this station when placing your order.`,
            data: {
              event: "nearby_station_stock_available",
              stationId: station.id,
              stationName: station.name,
              productId: product.id,
              productName: product.name,
              availableStock: product.stock,
            },
            notifyCustomer: true,
          })
        ));
      }
    }

    return res.status(existing ? 200 : 201).json({
      success: true,
      data: product,
      message: existing
        ? "Station stock replenished and notifications sent."
        : "Product added to station stock and notifications sent.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
