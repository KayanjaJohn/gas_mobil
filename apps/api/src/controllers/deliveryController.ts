import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Delivery } from '../entities/Delivery';

const deliveryRepository = AppDataSource.getRepository(Delivery);

export const getDeliveryTracking = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const delivery = await deliveryRepository.findOneBy({ orderId });

    if (!delivery) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }

    res.json({
      success: true,
      data: delivery,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDeliveryLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    const delivery = await deliveryRepository.findOneBy({ id });
    if (!delivery) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }

    delivery.currentLocation = { latitude, longitude };
    if (!delivery.route) {
      delivery.route = [];
    }
    delivery.route.push({ latitude, longitude });

    await deliveryRepository.save(delivery);

    res.json({
      success: true,
      data: delivery,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};