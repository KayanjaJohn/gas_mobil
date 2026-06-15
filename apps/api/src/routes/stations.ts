import express from 'express';
import {
  getStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
} from '../controllers/stationController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/', getStations);
router.get('/:id', getStationById);
router.post('/', authMiddleware, requireRole('admin'), createStation);
router.put('/:id', authMiddleware, requireRole('admin'), updateStation);
router.delete('/:id', authMiddleware, requireRole('admin'), deleteStation);

export default router;