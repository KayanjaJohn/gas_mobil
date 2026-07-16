import { Router } from 'express';
import { requireAuth, requireAgent } from '../middleware/requireRole';
import * as productController from '../controllers/productController';

const router = Router();

router.get('/', requireAuth, productController.getProducts);
router.post('/', requireAgent, productController.createProduct);
router.put('/:id', requireAgent, productController.updateProduct);
router.patch('/:id/availability', requireAgent, productController.toggleAvailability);
router.delete('/:id', requireAgent, productController.deleteProduct);

export default router;
