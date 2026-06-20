import api from './api';

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  stock: number;
  type: string;
  imageUrl?: string;
}

export const productService = {
  getProducts: () =>
    api.get('/products'),

  getProductById: (id: string) =>
    api.get(`/products/${id}`),

  createProduct: (data: ProductInput) =>
    api.post('/products', data),

  updateProduct: (id: string, data: Partial<ProductInput>) =>
    api.put(`/products/${id}`, data),

  updateStock: (id: string, stock: number) =>
    api.patch(`/products/${id}/stock`, { stock }),

  toggleAvailability: (id: string, isAvailable: boolean) =>
    api.patch(`/products/${id}/availability`, { isAvailable }),

  deleteProduct: (id: string) =>
    api.delete(`/products/${id}`),
};
