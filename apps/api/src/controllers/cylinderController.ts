import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Cylinder } from '../entities/Cylinder';

const cylinderRepository = AppDataSource.getRepository(Cylinder);

export const getCylinders = async (req: Request, res: Response) => {
  try {
    const cylinders = await cylinderRepository.findBy({ available: 0 }); // TypeORM: use findBy for simple conditions, or QueryBuilder for >
    // Actually we need available > 0, so use QueryBuilder:
    const availableCylinders = await cylinderRepository
      .createQueryBuilder('cylinder')
      .where('cylinder.available > 0')
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
    const cylinder = await cylinderRepository.findOneBy({ id });

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