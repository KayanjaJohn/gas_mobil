import api from './api';

export interface OrderFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const orderService = {
  getOrders: (filters?: OrderFilters) =>
    api.get('/agent/orders', { params: filters }),

  getOrderById: (id: string) =>
    api.get(`/orders/${id}`),

  assignDriver: (orderId: string, driverId: string) =>
    api.post(`/agent/orders/${orderId}/assign`, { driverId }),

  cancelOrder: (orderId: string, reason: string) =>
    api.post(`/agent/orders/${orderId}/cancel`, { reason }),

  updateOrderStatus: (orderId: string, status: string) =>
    api.put(`/agent/orders/${orderId}/status`, { status }),

  getOrderStats: () =>
    api.get('/agent/orders/stats'),
};
