import express, { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Product } from '../entities/Product';

const router = express.Router();
const productRepository = AppDataSource.getRepository(Product);

// Get all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await productRepository.find({
      where: { isAvailable: true },
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productRepository.findOne({ where: { id } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create product (admin only)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, price, size, imageUrl, stock } = req.body;
    const product = productRepository.create({
      name,
      description,
      price,
      size,
      imageUrl,
      stock,
    });
    await productRepository.save(product);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
