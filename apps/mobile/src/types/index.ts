export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  type: string;
  imageUrl?: string;
  isAvailable: boolean;
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
  createdAt: string;
  items: OrderItem[];
  driver?: Driver;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  product?: Product;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  currentLatitude?: number;
  currentLongitude?: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}
