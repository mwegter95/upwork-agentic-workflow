import axios from 'axios';

const BASE = 'https://api.michaelwegter.com/demos/orschell-excavating-e-commerce-full/api';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('orschell_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('orschell_token');
      localStorage.removeItem('orschell_user');
    }
    return Promise.reject(err);
  }
);

export default api;

// Typed helpers
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) => api.post('/auth/register', { email, password, name }),
  me: () => api.get('/auth/me'),
};

export const productsApi = {
  list: (params?: Record<string, string | number>) => api.get('/products', { params }),
  get: (slug: string) => api.get(`/products/${slug}`),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

export const categoriesApi = {
  list: () => api.get('/categories'),
};

export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (product_id: number, quantity: number) => api.post('/cart/items', { product_id, quantity }),
  updateItem: (id: number, quantity: number) => api.put(`/cart/items/${id}`, { quantity }),
  removeItem: (id: number) => api.delete(`/cart/items/${id}`),
  clear: () => api.delete('/cart'),
};

export const ordersApi = {
  list: () => api.get('/orders'),
  get: (id: number) => api.get(`/orders/${id}`),
  create: (data: Record<string, unknown>) => api.post('/orders', data),
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  inventory: () => api.get('/admin/inventory'),
  updateInventory: (pid: number, data: Record<string, number>) => api.put(`/admin/inventory/${pid}`, data),
  orders: (params?: Record<string, string | number>) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id: number, status: string) => api.put(`/admin/orders/${id}/status`, { status }),
};
