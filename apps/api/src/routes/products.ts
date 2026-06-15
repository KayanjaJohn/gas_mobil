import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductAvailability,
  deleteProduct,
} from '../controllers/productController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authMiddleware, requireRole('admin', 'agent'), createProduct);
router.put('/:id', authMiddleware, requireRole('admin', 'agent'), updateProduct);
router.patch('/:id/availability', authMiddleware, requireRole('admin', 'agent'), updateProductAvailability);
router.delete('/:id', authMiddleware, requireRole('admin'), deleteProduct);

export default router;