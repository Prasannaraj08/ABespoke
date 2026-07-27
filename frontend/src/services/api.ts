import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
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

// Track if we're currently refreshing to prevent infinite loops
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

// Response interceptor: auto-refresh access token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry refresh or login requests
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post('/auth/refresh');
        const newToken = response.data?.data?.token || response.data?.token;
        if (newToken) {
          localStorage.setItem('clara_luxe_token', newToken);
          api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — clear session and redirect to login
        localStorage.removeItem('clara_luxe_token');
        localStorage.removeItem('clara_luxe_user');
        window.dispatchEvent(new CustomEvent('auth-unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) {
      window.dispatchEvent(new CustomEvent('auth-unauthorized'));
    }

    return Promise.reject(error);
  }
);

/**
 * Maps Axios errors & HTTP status codes to user-friendly messages.
 * Prevents displaying raw 500 errors or technical stack traces to users.
 */
export function getFriendlyErrorMessage(error: any, fallback = 'Something went wrong on our side.'): string {
  if (!error || !error.response) {
    return 'Unable to reach the server. Please check your internet connection.';
  }
  const status = error.response.status;
  const data = error.response.data;

  if (data?.error?.message) {
    return data.error.message;
  }
  if (data?.message) {
    return data.message;
  }

  switch (status) {
    case 400: return 'Invalid request parameters. Please verify input data.';
    case 401: return 'Session expired. Please log in again.';
    case 403: return 'You don\'t have permission to perform this action.';
    case 404: return 'Requested resource not found.';
    case 409: return 'A resource with this information already exists.';
    case 429: return 'Too many requests. Please slow down and try again.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Something went wrong on our side.';
    default: return fallback;
  }
}

const getData = (res: any) => {
  const d = res.data;
  if (d && typeof d === 'object' && 'success' in d && 'data' in d) {
    return d.data;
  }
  return d;
};

// Add logout API
export const authAPI = {
  register: (payload: any) => api.post('/auth/register', payload).then(getData),
  login: (payload: any) => api.post('/auth/login', payload).then(getData),
  googleLogin: (payload: any) => api.post('/auth/google', payload).then(getData),
  getProfile: () => api.get('/auth/profile').then(getData),
  refresh: () => api.post('/auth/refresh').then(getData),
  logout: () => api.post('/auth/logout').then(getData),
};

export const productsAPI = {
  getProducts: (params: any) => api.get('/products', { params }).then(getData),
  getMeta: () => api.get('/products/meta').then(getData),
  getProductById: (id: string) => api.get(`/products/${id}`).then(getData),
  addReview: (id: string, payload: { rating: number; comment: string }) => 
    api.post(`/products/${id}/review`, payload).then(getData),
};

export const cartAPI = {
  getCart: () => api.get('/cart').then(getData),
  updateCart: (items: any[]) => api.post('/cart', { items }).then(getData),
  getWishlist: () => api.get('/wishlist').then(getData),
  toggleWishlist: (productId: string) => api.post('/wishlist/toggle', { productId }).then(getData),
};

export const checkoutAPI = {
  getAddresses: () => api.get('/addresses').then(getData),
  addAddress: (payload: any) => api.post('/addresses', payload).then(getData),
  updateAddress: (id: string, payload: any) => api.put(`/addresses/${id}`, payload).then(getData),
  deleteAddress: (id: string) => api.delete(`/addresses/${id}`).then(getData),
  applyCoupon: (code: string, subtotal: number) => api.post('/coupons/apply', { code, subtotal }).then(getData),
  getOrders: () => api.get('/orders').then(getData),
  getOrderById: (id: string) => api.get(`/orders/${id}`).then(getData),
  createOrder: (payload: any) => api.post('/orders', payload).then(getData),
  getInvoiceUrl: (id: string) => `${API_BASE_URL}/orders/${id}/invoice?token=${localStorage.getItem('clara_luxe_token')}`,
};

export const aiAPI = {
  getPersonalized: (viewedIds?: string[]) => 
    api.get('/ai/personalized', { params: { viewedIds: viewedIds?.join(',') } }).then(getData),
  getSimilar: (id: string) => api.get(`/ai/similar/${id}`).then(getData),
  getBundle: (id: string) => api.get(`/ai/bundle/${id}`).then(getData),
  getSearchSuggestions: (q: string) => api.get('/ai/search-suggestions', { params: { q } }).then(getData),
  getRecommendations: (params?: any) => api.get('/ai/personalized', { params }).then(getData),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats').then(getData),
  createProduct: (payload: any) => api.post('/admin/products', payload).then(getData),
  updateProduct: (id: string, payload: any) => api.put(`/admin/products/${id}`, payload).then(getData),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`).then(getData),
  getAllOrders: () => api.get('/admin/orders').then(getData),
  updateOrderStatus: (id: string, status: string) => api.put(`/admin/orders/${id}/status`, { status }).then(getData),
  getAllCoupons: () => api.get('/admin/coupons').then(getData),
  createCoupon: (payload: any) => api.post('/admin/coupons', payload).then(getData),
  deleteCoupon: (code: string) => api.delete(`/admin/coupons/${code}`).then(getData),
  getUsers: () => api.get('/admin/users').then(getData),
  verifyUser: (id: string, verified: boolean) => api.put(`/admin/users/${id}/verify`, { verified }).then(getData),
};

export const boutiqueAPI = {
  getProfile: () => api.get('/boutique/profile').then(getData),
  updateProfile: (payload: any) => api.put('/boutique/profile', payload).then(getData),
  getOrders: () => api.get('/boutique/orders').then(getData),
  updateOrderStatus: (id: string, status: string) => api.put(`/boutique/orders/${id}/status`, { status }).then(getData),
  getTailors: () => api.get('/boutique/tailors').then(getData),
  addTailor: (payload: any) => api.post('/boutique/tailors', payload).then(getData),
  deleteTailor: (id: string) => api.delete(`/boutique/tailors/${id}`).then(getData),
  getPortfolio: () => api.get('/boutique/portfolio').then(getData),
  addPortfolio: (payload: any) => api.post('/boutique/portfolio', payload).then(getData),
  deletePortfolio: (id: string) => api.delete(`/boutique/portfolio/${id}`).then(getData),
  getHiring: () => api.get('/boutique/hiring').then(getData),
  addHiring: (payload: any) => api.post('/boutique/hiring', payload).then(getData),
  deleteHiring: (id: string) => api.delete(`/boutique/hiring/${id}`).then(getData),
  getNotifications: () => api.get('/boutique/notifications').then(getData),
  markNotificationRead: (id: string) => api.put(`/boutique/notifications/${id}/read`).then(getData),
  markAllNotificationsRead: () => api.put('/boutique/notifications/read-all').then(getData),
  deleteNotification: (id: string) => api.delete(`/boutique/notifications/${id}`).then(getData),
};

export const publicBoutiqueAPI = {
  getBoutiques: () => api.get('/public/boutiques').then(getData),
  getBoutiqueById: (id: string) => api.get(`/public/boutiques/${id}`).then(getData),
};

export const designerAPI = {
  getProfile: () => api.get('/designer/profile').then(getData),
  updateProfile: (payload: any) => api.put('/designer/profile', payload).then(getData),
  getCustomizations: () => api.get('/designer/customizations').then(getData),
  updateCustomizationStatus: (id: string, status: string, reply?: string) => api.put(`/designer/customizations/${id}`, { status, reply }).then(getData),
  submitCustomization: (designerId: string, payload: { description: string }) => api.post(`/designer/${designerId}/customize`, payload).then(getData),
  getDesigners: () => api.get('/public/designers').then(getData),
};

export const uploadAPI = {
  uploadImage: async (file: File, onProgress?: (pct: number) => void) => {
    // 1. Fetch pre-signed signature from backend
    const creds = await api.get('/upload/signature').then(res => res.data);
    
    // 2. Upload file directly to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', creds.api_key);
    formData.append('timestamp', String(creds.timestamp));
    formData.append('signature', creds.signature);
    formData.append('folder', creds.folder);

    const uploadRes = await axios.post(
      `https://api.cloudinary.com/v1_1/${creds.cloud_name}/image/upload`,
      formData,
      { 
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(pct);
          }
        }
      }
    );
    
    return {
      url: uploadRes.data.secure_url,
      public_id: uploadRes.data.public_id
    };
  },
  deleteImage: (url: string) => api.delete('/upload', { data: { url } }).then(res => res.data),
};

export default api;
