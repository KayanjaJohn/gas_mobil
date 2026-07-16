import { Router } from 'express';
import { requireAuth } from '../middleware/requireRole';
import AppDataSource from '../config/database';
import { Station } from '../entities/Station';

const router = Router();

const getStationRepository = () => AppDataSource.getRepository(Station);

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const stationRepository = getStationRepository();
    const stations = await stationRepository.find({ where: { isActive: true } });
    res.json({ success: true, data: stations });
  } catch (error) {
    next(error);
  }
});

export default router;