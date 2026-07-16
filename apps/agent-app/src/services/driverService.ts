import api from './api';

export const driverService = {
  getDrivers: (status?: string) =>
    api.get('/agent/drivers', { params: { status } }),

  getDriverById: (id: string) =>
    api.get(`/agent/drivers/${id}`),

  updateDriverStatus: (id: string, status: string) =>
    api.put(`/agent/drivers/${id}/status`, { status }),

  getDriverDeliveries: (id: string) =>
    api.get(`/agent/drivers/${id}/deliveries`),

  getDriverStats: (id: string) =>
    api.get(`/agent/drivers/${id}/stats`),
};
