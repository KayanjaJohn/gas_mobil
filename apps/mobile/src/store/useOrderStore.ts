import { create } from 'zustand';
import { OrderType } from '../types';

interface OrderState {
  orderType: OrderType;
  size: string;
  deliveryAddress: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  paymentMethod: string;
  notes: string;
  setOrderType: (type: OrderType) => void;
  setSize: (size: string) => void;
  setDeliveryAddress: (address: string) => void;
  setLocation: (lat: number, lng: number) => void;
  setPaymentMethod: (method: string) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
}

const initialState = {
  orderType: 'swap' as OrderType,
  size: '12kg',
  deliveryAddress: '',
  deliveryLat: null,
  deliveryLng: null,
  paymentMethod: 'wallet',
  notes: '',
};

export const useOrderStore = create<OrderState>((set) => ({
  ...initialState,
  setOrderType: (type) => set({ orderType: type }),
  setSize: (size) => set({ size }),
  setDeliveryAddress: (address) => set({ deliveryAddress: address }),
  setLocation: (lat, lng) => set({ deliveryLat: lat, deliveryLng: lng }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setNotes: (notes) => set({ notes }),
  reset: () => set(initialState),
}));