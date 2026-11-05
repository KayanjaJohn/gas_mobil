import { Router } from 'express';
import { requireAuth } from '../middleware/requireRole';
import AppDataSource from '../config/database';
import { Station } from '../entities/Station';
import { inferUgandaRegion, normalizeUgandaRegion, isStationEligibleForLocation } from '../services/stationRegionService';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const stations = await AppDataSource.getRepository(Station).find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    const user = (req as any).user;
    const selectedRegion = normalizeUgandaRegion(req.query.region);
    if (req.query.region && !selectedRegion) {
      return res.status(400).json({ success: false, error: 'Unknown station region.' });
    }
    const location = {
      latitude: req.query.latitude ?? user?.latitude,
      longitude: req.query.longitude ?? user?.longitude,
      city: req.query.city ?? user?.city,
      address: req.query.address ?? user?.address,
    };
    const hasLocation = Boolean(
      (location.latitude != null && location.longitude != null) ||
      location.city || location.address
    );
    const filtered = selectedRegion
      ? stations.filter((station) => inferUgandaRegion(station) === selectedRegion)
      : user?.role === 'customer' && hasLocation
        ? stations.filter((station) => isStationEligibleForLocation(station, location))
        : stations;
    res.json({
      success: true,
      data: filtered,
      meta: {
        selectedRegion,
        detectedRegion: inferUgandaRegion(location),
        totalActiveStations: stations.length,
        eligibleStations: filtered.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
