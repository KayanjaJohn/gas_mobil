import { Request, Response } from "express";
import AppDataSource from "../config/database";
import { ProductCatalog } from "../entities/ProductCatalog";
import { Product } from "../entities/Product";
import { getIO } from "../config/socket";

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
    const existing = await productRepo
      .createQueryBuilder("product")
      .where("LOWER(product.name) = LOWER(:name)", { name: catalogItem.name })
      .andWhere("product.stationId = :stationId", { stationId: targetStationId })
      .getOne();
    if (existing) {
      return res.status(400).json({ success: false, error: "This product already exists at this station" });
    }
    const product = productRepo.create({
      name: catalogItem.name,
      description: catalogItem.description,
      price: price !== undefined ? price : catalogItem.defaultPrice,
      stock: stock || 0,
      weight: catalogItem.defaultWeight,
      size: catalogItem.defaultSize,
      type: catalogItem.category,
      imageUrl: imageUrl || catalogItem.imageUrl,
      isAvailable: true,
      stationId: targetStationId,
    });
    await productRepo.save(product);
    const io = getIO();
    io.to(`station_${targetStationId}`).emit("product_created", product);
    io.emit("product_updated", { type: "created", product });
    res.status(201).json({ success: true, data: product, message: "Product added to station stock" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
