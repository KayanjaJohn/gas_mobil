export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  stationId?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  driverStatus?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  weight: number | null;
  size: string | null;
  type: 'cylinder' | 'accessory';
  isAvailable: boolean;
  imageUrl: string | null;
  stationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  deliveryAddress: string;
  deliveryCity: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  stationId?: string;
  userId?: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  latitude?: number;
  longitude?: number;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  phone?: string;
  email?: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
