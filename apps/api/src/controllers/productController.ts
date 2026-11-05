import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Product } from '../entities/Product';
import { User } from '../entities/User';
import { Station } from '../entities/Station';
import { isStationEligibleForLocation } from '../services/stationRegionService';
import { getIO } from '../config/socket';
import { createSystemNotification } from '../services/notificationService';

const productRepository = AppDataSource.getRepository(Product);
const userRepository = AppDataSource.getRepository(User);

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    let query = productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.station', 'station');

    if (user.role === 'agent') {
      // Never fall back to a global product list when an agent has no station.
      const agent = await userRepository.findOne({ where: { id: user.id } });
      if (!agent?.stationId) {
        return res.status(403).json({
          success: false,
          error: "This agent account is not assigned to a station. Ask an administrator to assign one.",
        });
      }
      query = query.where('product.stationId = :stationId', { stationId: agent.stationId });
    } else if (user.role === 'customer') {
      const stationRepository = AppDataSource.getRepository(Station);
      const stations = await stationRepository.find({ where: { isActive: true } });
      const location = {
        latitude: req.query.latitude ?? user.latitude,
        longitude: req.query.longitude ?? user.longitude,
        city: req.query.city ?? user.city,
        address: req.query.address ?? user.address,
        region: req.query.region,
      };
      const hasLocation = location.latitude != null || location.longitude != null ||
        Boolean(location.city || location.address || location.region);
      const eligibleStationIds = hasLocation
        ? stations.filter((station) => isStationEligibleForLocation(station, location)).map((station) => station.id)
        : stations.map((station) => station.id);
      if (eligibleStationIds.length === 0) {
        return res.json({ success: true, data: [], meta: { message: "No stations are currently available in your region or within 50 km." } });
      }
      query = query.where('product.isAvailable = :isAvailable', { isAvailable: true })
        .andWhere('product.stationId IN (:...stationIds)', { stationIds: eligibleStationIds })
        .andWhere('station.isActive = :isActive', { isActive: true });
    }

    const products = await query.getMany();
    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, type, stationId, imageUrl, weight, size } = req.body;
    const { user } = req as any;

    let finalStationId = stationId;

    if (user.role === 'agent') {
      const agent = await userRepository.findOne({ where: { id: user.id } });
      if (!agent?.stationId) {
        return res.status(400).json({
          success: false,
          error: 'Agent is not assigned to a station. Contact admin.'
        });
      }
      finalStationId = agent.stationId;
    } else if (user.role === 'admin') {
      if (!finalStationId) {
        return res.status(400).json({
          success: false,
          error: 'Station ID is required for admin product creation'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        error: 'Only admin or agent can create products'
      });
    }

    const product = productRepository.create({
      name, description, price, stock,
      type: type || 'cylinder',
      stationId: finalStationId,
      isAvailable: true,
      imageUrl,
      weight: weight !== undefined ? weight : null,
      size: size || null,
    });

    await productRepository.save(product);
    if (user.role === 'admin') {
      try {
        await createSystemNotification({
          type: 'system_announcement',
          stationId: product.stationId,
          title: 'Station Product Added',
          message: `${product.name} was added to your station inventory with ${product.stock} units.`,
          data: { productId: product.id, stock: product.stock },
          notifyAgent: true,
        });
      } catch (notificationError) {
        console.error('[Product] Station notification failed:', notificationError);
      }
    }

    const io = getIO();
    io.to(`station_${finalStationId}`).emit('product_created', product);
    io.emit('product_updated', { type: 'created', product });

    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const toggleAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    const { user } = req as any;

    const product = await productRepository.findOne({
      where: { id },
      relations: ['station']
    });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (user.role === 'agent' && product.stationId !== user.stationId) {
      return res.status(403).json({ success: false, error: 'Access denied: not your station' });
    }

    product.isAvailable = isAvailable;
    await productRepository.save(product);

    const io = getIO();
    io.to(`station_${product.stationId}`).emit('product_updated', product);
    io.emit('product_updated', { type: 'availability', product });

    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { user } = req as any;

    const product = await productRepository.findOne({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (user.role === 'agent' && product.stationId !== user.stationId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const previousStock = Number(product.stock);
    // Keep station ownership server-controlled; stock updates must not silently
    // transfer inventory across stations.
    if (updates.stationId && updates.stationId !== product.stationId) {
      return res.status(400).json({ success: false, error: 'Transfer station inventory through an authorized transfer workflow.' });
    }

    Object.assign(product, updates);
    // Restocking must restore customer availability. Previously depleted
    // products could remain isAvailable=false after the admin raised stock.
    if (updates.stock !== undefined && Number(updates.stock) > 0 && updates.isAvailable === undefined) {
      product.isAvailable = true;
    }
    if (updates.stock !== undefined && Number(updates.stock) <= 0) {
      product.isAvailable = false;
    }
    await productRepository.save(product);
    if (user.role === 'admin' && updates.stock !== undefined && Number(product.stock) !== previousStock) {
      try {
        await createSystemNotification({
          type: 'system_announcement',
          stationId: product.stationId,
          title: 'Station Stock Updated',
          message: `${product.name}: stock changed from ${previousStock} to ${product.stock} units.`,
          data: { productId: product.id, previousStock, stock: Number(product.stock) },
          notifyAgent: true,
        });
      } catch (notificationError) {
        console.error('[Product] Station stock notification failed:', notificationError);
      }
    }

    const io = getIO();
    io.to(`station_${product.stationId}`).emit('product_updated', product);
    io.emit('product_updated', { type: 'updated', product });

    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req as any;

    const product = await productRepository.findOne({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (user.role === 'agent' && product.stationId !== user.stationId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await productRepository.remove(product);

    const io = getIO();
    io.to(`station_${product.stationId}`).emit('product_deleted', { id: product.id });
    io.emit('product_deleted', { id: product.id });

    res.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
