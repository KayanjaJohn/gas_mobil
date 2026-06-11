import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';

const productRepository = AppDataSource.getRepository(Product);

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await productRepository.find();
    res.json({ success: true, products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const product = await productRepository.findOneBy({ id: productId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, weight, type } = req.body;

    const product = productRepository.create({
      name,
      description,
      price,
      stock,
      weight,
      type,
    });

    await productRepository.save(product);

    res.status(201).json({ success: true, message: 'Product created', product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};