import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      productId: z.string().uuid(),
      quantity: z.number().min(1),
    })).min(1, 'At least one item is required'),
    deliveryAddress: z.string().min(5, 'Delivery address is required'),
    deliveryCity: z.string().optional(),
    deliveryLatitude: z.number().min(-90).max(90).optional(),
    deliveryLongitude: z.number().min(-180).max(180).optional(),
    paymentMethod: z.enum(['mtn', 'airtel', 'visa', 'wallet', 'cash']),
    orderType: z.enum(['quick', 'swap', 'buy_new', 'find_agent']).optional(),
    notes: z.string().optional(),
  }),
});

export const cancelOrderSchema = z.object({
  body: z.object({
    reason: z.string().min(1, 'Cancellation reason is required').optional(),
  }),
});