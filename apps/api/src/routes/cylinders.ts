import express from 'express';
import { getCylinders, getCylinderById } from '../controllers/cylinderController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/', getCylinders);
router.get('/:id', getCylinderById);

export default router;
