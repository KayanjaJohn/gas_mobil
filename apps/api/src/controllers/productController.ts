import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Product } from '../entities/Product';

const productRepository = AppDataSource.getRepository(Product);

export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const stationId = req.query.stationId as string;

    const where: any = { isAvailable: true };
    if (stationId) where.stationId = stationId;

    const [products, total] = await productRepository.findAndCount({
      where,
      relations: ['station'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    res.json({
      success: true,
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productRepository.findOne({
      where: { id },
      relations: ['station'],
    });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, weight, size, imageUrl, type, stationId } = req.body;

    const product = productRepository.create({
      name,
      description,
      price,
      stock: stock || 0,
      weight,
      size,
      imageUrl,
      type: type || 'cylinder',
      stationId,
      isAvailable: true,
    });

    await productRepository.save(product);

    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await productRepository.findOneBy({ id });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    Object.assign(product, updates);
    await productRepository.save(product);

    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProductAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const product = await productRepository.findOneBy({ id });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    product.isAvailable = isAvailable;
    await productRepository.save(product);

    res.json({
      success: true,
      data: product,
      message: `Product ${isAvailable ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productRepository.findOneBy({ id });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    await productRepository.remove(product);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};