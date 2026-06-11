import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Accessory } from '../entities/Accessory';

const accessoryRepository = AppDataSource.getRepository(Accessory);

export const getAccessories = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const queryBuilder = accessoryRepository.createQueryBuilder('accessory');

    if (category) {
      queryBuilder.where('accessory.category = :category', { category });
    }

    const accessories = await queryBuilder.getMany();

    res.json({
      success: true,
      data: accessories,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAccessoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const accessory = await accessoryRepository.findOneBy({ id });

    if (!accessory) {
      return res.status(404).json({ success: false, error: 'Accessory not found' });
    }

    res.json({
      success: true,
      data: accessory,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};