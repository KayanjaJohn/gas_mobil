export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  driverStatus: 'online' | 'offline' | 'busy' | 'on_break';
  vehicleNumber?: string;
  vehicleType?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  station?: Station;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Order {
  id: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  deliveryCity?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  paymentMethod: string;
  paymentStatus: string;
  orderType?: string;
  notes?: string;
  createdAt: string;
  items: OrderItem[];
  user?: Customer;
  station?: Station;
  deliveries?: Delivery[];
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  product?: Product;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  currentLocation?: LocationPoint;
  estimatedArrival?: string;
  status: string;
  route: LocationPoint[];
  deliveryPhoto?: string;
  customerSignature?: string;
  rating?: number;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp?: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface Earning {
  id: string;
  orderId: string;
  amount: number;
  commission: number;
  date: string;
  status: 'pending' | 'paid';
}
