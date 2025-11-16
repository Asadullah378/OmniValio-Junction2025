import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8000';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If sending FormData, remove Content-Type header to let axios set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Customer Dashboard API
export const customerDashboardApi = {
  getDashboard: async () => {
    const response = await api.get('/customer/dashboard/');
    return response.data;
  },
  getActionsNeeded: async () => {
    const response = await api.get('/customer/dashboard/actions-needed');
    return response.data;
  },
};

// Customer Orders API
export const customerOrdersApi = {
  getOrders: async (params?: { status?: string; skip?: number; limit?: number }) => {
    const response = await api.get('/customer/orders/', { params });
    return response.data;
  },
  getOrder: async (orderId: string) => {
    const response = await api.get(`/customer/orders/${orderId}`);
    return response.data;
  },
  placeOrder: async (orderData: any) => {
    const response = await api.post('/customer/orders/', orderData);
    return response.data;
  },
  getOrderMessages: async (orderId: string) => {
    const response = await api.get(`/customer/orders/${orderId}/messages`);
    return response.data;
  },
  sendOrderMessage: async (orderId: string, content: string) => {
    const response = await api.post(`/customer/orders/${orderId}/messages`, {
      content,
      order_id: orderId,
    });
    return response.data;
  },
};

// Customer Products API
export const customerProductsApi = {
  getProducts: async (params?: { 
    search?: string; 
    category?: string; 
    sub_category?: string;
    temperature_zone?: string;
    skip?: number; 
    limit?: number;
  }) => {
    const response = await api.get('/customer/products/', { params });
    return response.data;
  },
  getProduct: async (productCode: string) => {
    const response = await api.get(`/customer/products/${productCode}`);
    return response.data;
  },
  assessProductsRisk: async (products: Array<{
    product_code: string;
    order_qty: number;
    order_created_date: string; // YYYY-MM-DD
    requested_delivery_date: string; // YYYY-MM-DD
  }>) => {
    const response = await api.post('/customer/products/risk/batch', {
      products,
    });
    return response.data;
  },
  getSimilarProducts: async (productCode: string, limit: number = 6) => {
    const response = await api.get(`/customer/products/${productCode}/similar`, {
      params: { limit },
    });
    return response.data;
  },
  getCategories: async () => {
    const response = await api.get('/customer/products/categories');
    return response.data;
  },
};

// Customer Cart API
export const customerCartApi = {
  getCart: async () => {
    const response = await api.get('/customer/cart/');
    return response.data;
  },
  addToCart: async (item: any) => {
    const response = await api.post('/customer/cart/items', item);
    return response.data;
  },
  updateQuantity: async (cartItemId: number, quantity: number) => {
    const response = await api.patch(`/customer/cart/items/${cartItemId}/quantity`, { quantity });
    return response.data;
  },
  removeFromCart: async (cartItemId: number) => {
    const response = await api.delete(`/customer/cart/items/${cartItemId}`);
    return response.data;
  },
  clearCart: async () => {
    const response = await api.delete('/customer/cart/');
    return response.data;
  },
};

// Customer Claims API
export const customerClaimsApi = {
  getClaims: async () => {
    const response = await api.get('/customer/claims/');
    return response.data;
  },
  getClaim: async (claimId: string) => {
    const response = await api.get(`/customer/claims/${claimId}`);
    return response.data;
  },
  createClaim: async (formData: FormData) => {
    // Axios will automatically set Content-Type with boundary for FormData
    // The interceptor will remove the default Content-Type header
    // All parameters (order_id, claim_type, description, files) are in FormData
    const response = await api.post('/customer/claims/', formData);
    return response.data;
  },
  getClaimMessages: async (claimId: string) => {
    const response = await api.get(`/customer/claims/${claimId}/messages`);
    return response.data;
  },
  sendClaimMessage: async (claimId: string, content: string) => {
    const response = await api.post(`/customer/claims/${claimId}/messages`, {
      content,
      claim_id: claimId,
    });
    return response.data;
  },
};

// Customer Payments API
export const customerPaymentsApi = {
  getInvoices: async () => {
    const response = await api.get('/customer/payments/invoices');
    return response.data;
  },
  getInvoice: async (invoiceId: string) => {
    const response = await api.get(`/customer/payments/invoices/${invoiceId}`);
    return response.data;
  },
};

// Admin Orders API
export const adminOrdersApi = {
  getOrders: async (params?: { status?: string; skip?: number; limit?: number }) => {
    const response = await api.get('/admin/orders/', { params });
    return response.data;
  },
  getOrder: async (orderId: string) => {
    const response = await api.get(`/admin/orders/${orderId}`);
    return response.data;
  },
  updateOrderStatus: async (orderId: string, status: string, notes?: string) => {
    const params: Record<string, string> = { status };
    if (notes) {
      params.notes = notes;
    }
    const response = await api.put(`/admin/orders/${orderId}/status`, null, { params });
    return response.data;
  },
  replaceProduct: async (orderId: string, lineId: number, substituteProductCode: string) => {
    const response = await api.post(`/admin/orders/${orderId}/replace-product`, null, {
      params: {
        line_id: lineId.toString(),
        substitute_product_code: substituteProductCode,
      },
    });
    return response.data;
  },
  getOrderMessages: async (orderId: string) => {
    const response = await api.get(`/admin/orders/${orderId}/messages`);
    return response.data;
  },
  sendOrderMessage: async (orderId: string, content: string) => {
    const response = await api.post(`/admin/orders/${orderId}/messages`, {
      content,
      order_id: orderId,
    });
    return response.data;
  },
};

// Admin Claims API
export const adminClaimsApi = {
  getClaims: async (params?: { status?: string; requires_manual_review?: boolean }) => {
    const response = await api.get('/admin/claims/', { params });
    return response.data;
  },
  getManualReviewClaims: async () => {
    const response = await api.get('/admin/claims/manual-review');
    return response.data;
  },
  getClaim: async (claimId: string) => {
    const response = await api.get(`/admin/claims/${claimId}`);
    return response.data;
  },
  approveClaim: async (claimId: string, refundAmount?: number) => {
    const response = await api.post(`/admin/claims/${claimId}/approve`, null, {
      params: { refund_amount: refundAmount },
    });
    return response.data;
  },
  rejectClaim: async (claimId: string, reason: string) => {
    const response = await api.post(`/admin/claims/${claimId}/reject`, null, {
      params: { reason },
    });
    return response.data;
  },
  getClaimMessages: async (claimId: string) => {
    const response = await api.get(`/admin/claims/${claimId}/messages`);
    return response.data;
  },
  sendClaimMessage: async (claimId: string, content: string) => {
    const response = await api.post(`/admin/claims/${claimId}/messages`, {
      content,
      claim_id: claimId,
    });
    return response.data;
  },
};

// Admin Customers API
export const adminCustomersApi = {
  getCustomers: async () => {
    const response = await api.get('/admin/customers/');
    return response.data;
  },
  getCustomer: async (customerId: string) => {
    const response = await api.get(`/admin/customers/${customerId}`);
    return response.data;
  },
  createCustomer: async (customerData: any) => {
    const response = await api.post('/admin/customers/', customerData);
    return response.data;
  },
  createCustomerUser: async (customerId: string, userData: { username: string; email: string; password: string }) => {
    const response = await api.post(`/admin/customers/${customerId}/user`, null, {
      params: {
        username: userData.username,
        email: userData.email,
        password: userData.password,
      },
    });
    return response.data;
  },
};

// Admin Products API
export const adminProductsApi = {
  getProducts: async (params?: {
    skip?: number;
    limit?: number;
    category?: string | null;
    sub_category?: string | null;
    search?: string | null;
    temperature_zone?: string | null;
  }) => {
    const response = await api.get('/admin/products/', { params });
    return response.data;
  },
  getProduct: async (productCode: string) => {
    const response = await api.get(`/admin/products/${productCode}`);
    return response.data;
  },
  createProduct: async (productData: any) => {
    const response = await api.post('/admin/products/', productData);
    return response.data;
  },
  updateProduct: async (productCode: string, productData: any) => {
    const response = await api.put(`/admin/products/${productCode}`, productData);
    return response.data;
  },
  deleteProduct: async (productCode: string) => {
    const response = await api.delete(`/admin/products/${productCode}`);
    return response.data;
  },
};

// Admin Inventory API
export const adminInventoryApi = {
  getInventory: async (params?: {
    skip?: number;
    limit?: number;
    search?: string | null;
  }) => {
    const response = await api.get('/admin/inventory/', { params });
    return response.data;
  },
  getInventoryItem: async (productCode: string) => {
    const response = await api.get(`/admin/inventory/${productCode}`);
    return response.data;
  },
  updateInventory: async (productCode: string, quantity: number) => {
    const response = await api.put(`/admin/inventory/${productCode}`, { quantity });
    return response.data;
  },
  deleteInventory: async (productCode: string) => {
    const response = await api.delete(`/admin/inventory/${productCode}`);
    return response.data;
  },
};
