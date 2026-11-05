import { Router } from 'express';
import { requireAuth } from '../middleware/requireRole';
import AppDataSource from '../config/database';
import { Station } from '../entities/Station';
import { inferUgandaRegion, normalizeUgandaRegion } from '../services/stationRegionService';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const stations = await AppDataSource.getRepository(Station).find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    const selectedRegion = normalizeUgandaRegion(req.query.region);
    if (req.query.region && !selectedRegion) {
      return res.status(400).json({ success: false, error: 'Unknown station region.' });
    }
    // The customer stations directory is intentionally nationwide. Filtering
    // by saved profile GPS/address hid stations from customers outside the
    // nearest 50 km and made regional browsing incomplete. Only an explicit
    // region tab selection should filter the directory.
    const directory = stations.map((station) => ({
      ...station,
      region: inferUgandaRegion(station) ?? normalizeUgandaRegion(station.region) ?? station.region,
    }));
    const filtered = selectedRegion
      ? directory.filter((station) => inferUgandaRegion(station) === selectedRegion)
      : directory;
    res.json({
      success: true,
      data: filtered,
      meta: {
        selectedRegion,
        detectedRegion: null,
        totalActiveStations: stations.length,
        eligibleStations: filtered.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
