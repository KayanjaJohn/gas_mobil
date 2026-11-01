import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Product } from '../entities/Product';

const cylinderRepository = AppDataSource.getRepository(Product);

export const getCylinders = async (req: Request, res: Response) => {
  try {
    const availableCylinders = await cylinderRepository
      .createQueryBuilder('cylinder')
      .where('cylinder.stock > 0 AND cylinder.isAvailable = :isAvailable', { isAvailable: true })
      .getMany();

    res.json({
      success: true,
      data: availableCylinders,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCylinderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cylinder = await cylinderRepository.findOneBy({ id, type: 'cylinder' });

    if (!cylinder) {
      return res.status(404).json({ success: false, error: 'Cylinder not found' });
    }

    res.json({
      success: true,
      data: cylinder,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};