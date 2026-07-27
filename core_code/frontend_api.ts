import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('clara_luxe_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear token and user info if token is invalid/expired
      if (localStorage.getItem('clara_luxe_token')) {
        localStorage.removeItem('clara_luxe_token');
        localStorage.removeItem('clara_luxe_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (payload: any) => api.post('/auth/register', payload).then(res => res.data),
  login: (payload: any) => api.post('/auth/login', payload).then(res => res.data),
  googleLogin: (payload: any) => api.post('/auth/google', payload).then(res => res.data),
  getProfile: () => api.get('/auth/profile').then(res => res.data),
};

export const productsAPI = {
  getProducts: (params: any) => api.get('/products', { params }).then(res => res.data),
  getMeta: () => api.get('/products/meta').then(res => res.data),
  getProductById: (id: string) => api.get(`/products/${id}`).then(res => res.data),
  addReview: (id: string, payload: { rating: number; comment: string }) => 
    api.post(`/products/${id}/review`, payload).then(res => res.data),
};

export const cartAPI = {
  getCart: () => api.get('/cart').then(res => res.data),
  updateCart: (items: any[]) => api.post('/cart', { items }).then(res => res.data),
  getWishlist: () => api.get('/wishlist').then(res => res.data),
  toggleWishlist: (productId: string) => api.post('/wishlist/toggle', { productId }).then(res => res.data),
};

export const checkoutAPI = {
  getAddresses: () => api.get('/addresses').then(res => res.data),
  addAddress: (payload: any) => api.post('/addresses', payload).then(res => res.data),
  updateAddress: (id: string, payload: any) => api.put(`/addresses/${id}`, payload).then(res => res.data),
  deleteAddress: (id: string) => api.delete(`/addresses/${id}`).then(res => res.data),
  applyCoupon: (code: string, subtotal: number) => api.post('/coupons/apply', { code, subtotal }).then(res => res.data),
  getOrders: () => api.get('/orders').then(res => res.data),
  getOrderById: (id: string) => api.get(`/orders/${id}`).then(res => res.data),
  createOrder: (payload: any) => api.post('/orders', payload).then(res => res.data),
  getInvoiceUrl: (id: string) => `${API_BASE_URL}/orders/${id}/invoice?token=${localStorage.getItem('clara_luxe_token')}`,
};

export const aiAPI = {
  getPersonalized: (viewedIds?: string[]) => 
    api.get('/ai/personalized', { params: { viewedIds: viewedIds?.join(',') } }).then(res => res.data),
  getSimilar: (id: string) => api.get(`/ai/similar/${id}`).then(res => res.data),
  getBundle: (id: string) => api.get(`/ai/bundle/${id}`).then(res => res.data),
  getSearchSuggestions: (q: string) => api.get('/ai/search-suggestions', { params: { q } }).then(res => res.data),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats').then(res => res.data),
  createProduct: (payload: any) => api.post('/admin/products', payload).then(res => res.data),
  updateProduct: (id: string, payload: any) => api.put(`/admin/products/${id}`, payload).then(res => res.data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`).then(res => res.data),
  getAllOrders: () => api.get('/admin/orders').then(res => res.data),
  updateOrderStatus: (id: string, status: string) => api.put(`/admin/orders/${id}/status`, { status }).then(res => res.data),
  getAllCoupons: () => api.get('/admin/coupons').then(res => res.data),
  createCoupon: (payload: any) => api.post('/admin/coupons', payload).then(res => res.data),
  deleteCoupon: (code: string) => api.delete(`/admin/coupons/${code}`).then(res => res.data),
  getUsers: () => api.get('/admin/users').then(res => res.data),
  verifyUser: (id: string, verified: boolean) => api.put(`/admin/users/${id}/verify`, { verified }).then(res => res.data),
};

export const boutiqueAPI = {
  getProfile: () => api.get('/boutique/profile').then(res => res.data),
  updateProfile: (payload: any) => api.put('/boutique/profile', payload).then(res => res.data),
  getOrders: () => api.get('/boutique/orders').then(res => res.data),
  updateOrderStatus: (id: string, status: string) => api.put(`/boutique/orders/${id}/status`, { status }).then(res => res.data),
  getTailors: () => api.get('/boutique/tailors').then(res => res.data),
  addTailor: (payload: any) => api.post('/boutique/tailors', payload).then(res => res.data),
  deleteTailor: (id: string) => api.delete(`/boutique/tailors/${id}`).then(res => res.data),
  getPortfolio: () => api.get('/boutique/portfolio').then(res => res.data),
  addPortfolio: (payload: any) => api.post('/boutique/portfolio', payload).then(res => res.data),
  deletePortfolio: (id: string) => api.delete(`/boutique/portfolio/${id}`).then(res => res.data),
  getHiring: () => api.get('/boutique/hiring').then(res => res.data),
  addHiring: (payload: any) => api.post('/boutique/hiring', payload).then(res => res.data),
  deleteHiring: (id: string) => api.delete(`/boutique/hiring/${id}`).then(res => res.data),
  getNotifications: () => api.get('/boutique/notifications').then(res => res.data),
  markNotificationRead: (id: string) => api.put(`/boutique/notifications/${id}/read`).then(res => res.data),
  markAllNotificationsRead: () => api.put('/boutique/notifications/read-all').then(res => res.data),
  deleteNotification: (id: string) => api.delete(`/boutique/notifications/${id}`).then(res => res.data),
};

export const publicBoutiqueAPI = {
  getBoutiques: () => api.get('/public/boutiques').then(res => res.data),
  getBoutiqueById: (id: string) => api.get(`/public/boutiques/${id}`).then(res => res.data),
};

export const designerAPI = {
  getProfile: () => api.get('/designer/profile').then(res => res.data),
  updateProfile: (payload: any) => api.put('/designer/profile', payload).then(res => res.data),
  getCustomizations: () => api.get('/designer/customizations').then(res => res.data),
  updateCustomizationStatus: (id: string, status: string, reply?: string) => api.put(`/designer/customizations/${id}`, { status, reply }).then(res => res.data),
  submitCustomization: (designerId: string, payload: { description: string }) => api.post(`/designer/${designerId}/customize`, payload).then(res => res.data),
  getDesigners: () => api.get('/public/designers').then(res => res.data),
};

export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
  deleteImage: (url: string) => api.delete('/upload', { data: { url } }).then(res => res.data),
};

export default api;
