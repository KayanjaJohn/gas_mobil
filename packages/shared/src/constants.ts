export const GAS_CYLINDER_TYPES = {
  LPG: 'lpg',
  COMPRESSED: 'compressed',
  OXYGEN: 'oxygen',
} as const;

export const CYLINDER_SIZES = {
  SMALL: '5kg',
  MEDIUM: '15kg',
  LARGE: '25kg',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_DELIVERY: 'in_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const DELIVERY_STATUS = {
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  ON_THE_WAY: 'on_the_way',
  ARRIVED: 'arrived',
  COMPLETED: 'completed',
} as const;

export const PAYMENT_METHODS = {
  CARD: 'card',
  WALLET: 'wallet',
  CASH: 'cash',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
