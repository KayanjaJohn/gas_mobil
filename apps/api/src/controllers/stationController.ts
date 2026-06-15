import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Station } from '../entities/Station';

const stationRepository = AppDataSource.getRepository(Station);

export const getStations = async (req: Request, res: Response) => {
  try {
    const stations = await stationRepository.find({
      where: { isActive: true, status: 'active' },
      relations: ['agents', 'products'],
    });

    res.json({ success: true, data: stations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const station = await stationRepository.findOne({
      where: { id },
      relations: ['agents', 'products'],
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
      isActive: true,
      status: 'active',
    });

    await stationRepository.save(station);

    res.status(201).json({ success: true, data: station });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateStation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const station = await stationRepository.findOneBy({ id });
    if (!station) {
      return res.status(404).json({ success: false, error: 'Station not found' });
    }

    Object.assign(station, updates);
    await stationRepository.save(station);

    res.json({ success: true, data: station });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteStation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const station = await stationRepository.findOneBy({ id });

    if (!station) {
      return res.status(404).json({ success: false, error: 'Station not found' });
    }

    await stationRepository.remove(station);
    res.json({ success: true, message: 'Station deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};