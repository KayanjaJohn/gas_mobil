export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'customer' | 'driver' | 'agent' | 'admin';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  cylinderSize: '6kg' | '12kg' | '45kg';
  quantity: number;
  status: 'pending' | 'confirmed' | 'on-way' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  totalPrice: number;
  paymentMethod: 'cash' | 'wallet' | 'mpesa' | 'airtel';
  createdAt: string;
  deliveryTime?: string;
  driverId?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    refreshToken?: string;
    user: User;
  };
}
