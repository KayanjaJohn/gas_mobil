// ── User & Auth ─────────────────────────────────────────────
export type UserRole = 'admin' | 'agent' | 'driver' | 'customer';
export type DriverStatus = 'online' | 'offline' | 'busy' | 'on_break';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  driverStatus?: DriverStatus | null;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  lastLocationUpdate?: Date | null;
  vehicleNumber?: string | null;
  vehicleType?: string | null;
  stationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ── Products ─────────────────────────────────────────────────
export type ProductType = 'cylinder' | 'accessory' | 'burner' | 'grill' | 'hose' | 'regulator';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  type: ProductType;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Orders ───────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'driver_assigned'
  | 'picked_up'
  | 'in_transit'
  | 'nearby'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'refunded';

export type PaymentMethod = 'cash' | 'wallet' | 'momo' | 'airtel';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderType = 'swap' | 'buy';

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  user?: User;
  stationId: string;
  station?: Station;
  totalAmount: number;
  deliveryAddress: string;
  deliveryCity?: string | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string | null;
  cancellationReason?: string | null;
  items: OrderItem[];
  deliveries?: Delivery[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Delivery ─────────────────────────────────────────────────
export type DeliveryStatus = 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';

export interface Delivery {
  id: string;
  orderId: string;
  order?: Order;
  driverId: string;
  driver?: User;
  status: DeliveryStatus;
  deliveryPhoto?: string | null;
  customerSignature?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Station ──────────────────────────────────────────────────
export interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  phone?: string;
  email?: string;
  agents?: User[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Cart ─────────────────────────────────────────────────────
export interface CartItem {
  product: Product;
  quantity: number;
}

// ── Tracking ─────────────────────────────────────────────────
export interface TrackingEvent {
  status: OrderStatus;
  label: string;
  timestamp: Date;
  done: boolean;
}

// ── Green Impact ─────────────────────────────────────────────
export interface GreenStats {
  co2SavedKg: number;
  treesEquivalent: number;
  cylindersRecycled: number;
  cleanEnergyKwh: number;
  waterSavedLiters: number;
  rankPercentile: number;
}