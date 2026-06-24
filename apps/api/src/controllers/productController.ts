import { Request, Response } from 'express';
import AppDataSource  from '../config/database';
import { Product } from '../entities/Product';
import { User } from '../entities/User';

const productRepository = AppDataSource.getRepository(Product);
const userRepository = AppDataSource.getRepository(User);

// GET /api/products - Role-based product listing
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    let query = productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.station', 'station');

    // AGENT: only see products from their station
    if (user.role === 'agent') {
      const agent = await userRepository.findOne({ where: { id: user.id } });
      if (agent?.stationId) {
        query = query.where('product.stationId = :stationId', { stationId: agent.stationId });
      }
    }
    // CUSTOMER: only see available products from active stations
    else if (user.role === 'customer') {
      query = query.where('product.isAvailable = :isAvailable', { isAvailable: true })
        .andWhere('station.isActive = :isActive', { isActive: true });
    }
    // ADMIN: sees all (no filter)

    const products = await query.getMany();
    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/products - Create product (Admin/Agent only)
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, type, stationId, imageUrl } = req.body;
    const { user } = req as any;

    // Determine stationId based on role
    let finalStationId = stationId;

    if (user.role === 'agent') {
      // Agent MUST use their own station
      const agent = await userRepository.findOne({ where: { id: user.id } });
      if (!agent?.stationId) {
        return res.status(400).json({
          success: false,
          error: 'Agent is not assigned to a station. Contact admin.'
        });
      }
      finalStationId = agent.stationId;
    } else if (user.role === 'admin') {
      // Admin must provide stationId or we reject
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
      name,
      description,
      price,
      stock,
      type: type || 'cylinder',
      stationId: finalStationId,
      isAvailable: true,
      imageUrl
    });

    await productRepository.save(product);
    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/products/:id/availability - Toggle availability
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

    // Agent can only toggle products from their station
    if (user.role === 'agent' && product.stationId !== user.stationId) {
      return res.status(403).json({ success: false, error: 'Access denied: not your station' });
    }

    product.isAvailable = isAvailable;
    await productRepository.save(product);
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/products/:id - Update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { user } = req as any;

    const product = await productRepository.findOne({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Role-based access check
    if (user.role === 'agent' && product.stationId !== user.stationId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    Object.assign(product, updates);
    await productRepository.save(product);
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/products/:id - Delete product
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
    res.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
