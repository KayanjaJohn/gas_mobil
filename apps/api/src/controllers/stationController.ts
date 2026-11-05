import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Station } from '../entities/Station';
import { inferUgandaRegion, isStationEligibleForLocation } from '../services/stationRegionService';

const stationRepository = AppDataSource.getRepository(Station);

export const getAllStations = async (req: Request, res: Response) => {
  try {
    const stations = await stationRepository.find({ where: { isActive: true } });
    const { user } = req as any;

    // Admins and agents need their operational station directory. Customers
    // receive only same-region or genuinely nearby stations.
    if (user?.role === "customer") {
      const location = {
        latitude: req.query.latitude ?? user.latitude,
        longitude: req.query.longitude ?? user.longitude,
        city: req.query.city ?? user.city,
        address: req.query.address ?? user.address,
        region: req.query.region,
      };
      const hasLocation = location.latitude != null || location.longitude != null ||
        Boolean(location.city || location.address || location.region);
      const eligible = hasLocation
        ? stations.filter((station) => isStationEligibleForLocation(station, location))
        : stations;
      return res.json({
        success: true,
        data: eligible,
        meta: {
          detectedRegion: inferUgandaRegion(location),
          totalActiveStations: stations.length,
          eligibleStations: eligible.length,
          nearbyRadiusKm: 50,
        },
      });
    }

    return res.json({ success: true, data: stations });
  } catch (error: any) {
    console.error("[getAllStations] failed:", error);
    res.status(500).json({ success: false, error: "We couldn't load stations. Please try again." });
  }
};

export const getStationById = async (req: Request, res: Response) => {
  try {
    const station = await stationRepository.findOne({
      where: { id: req.params.id },
      relations: ['products', 'agents', 'orders']
    });

    if (!station) {
      return res.status(404).json({ success: false, error: 'Station not found' });
    }

    res.json({ success: true, data: station });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createStation = async (req: Request, res: Response) => {
  try {
    const { name, address, latitude, longitude, phone, email } = req.body;

    const station = stationRepository.create({
      name,
      address,
      latitude,
      longitude,
      phone,
      email,
      isActive: true
    });

    await stationRepository.save(station);
    res.status(201).json({ success: true, data: station });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateStation = async (req: Request, res: Response) => {
  try {
    await stationRepository.update(req.params.id, req.body);

    const updated = await stationRepository.findOne({ where: { id: req.params.id } });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteStation = async (req: Request, res: Response) => {
  try {
    await stationRepository.update(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Station deactivated' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getNearestStation = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.body;

    const stations = await stationRepository.find({ where: { isActive: true } });

    let nearest = null;
    let minDistance = Infinity;

    for (const station of stations) {
      const distance = calculateDistance(
        Number(latitude),
        Number(longitude),
        Number(station.latitude),
        Number(station.longitude)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = station;
      }
    }

    res.json({ success: true, data: { station: nearest, distance: minDistance } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}