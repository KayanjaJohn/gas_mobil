import api from './api';

export const driverService = {
  getDrivers: (status?: string) =>
    api.get('/admin/drivers', { params: { status } }),

  getDriverById: (id: string) =>
    api.get(`/admin/drivers/${id}`),

  updateDriverStatus: (id: string, status: string) =>
    api.put(`/admin/drivers/${id}/status`, { status }),

  getDriverDeliveries: (id: string) =>
    api.get(`/admin/drivers/${id}/deliveries`),

  getDriverStats: (id: string) =>
    api.get(`/admin/drivers/${id}/stats`),
};
