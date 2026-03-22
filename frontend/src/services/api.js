const API_URL = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

// Auth
export const authAPI = {
  register: (data) => fetch(`${API_URL}/auth/register`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  login: (data) => fetch(`${API_URL}/auth/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  getMe: () => fetch(`${API_URL}/auth/me`, { headers: getHeaders() }).then(handleResponse),
  updateProfile: (data) => fetch(`${API_URL}/auth/profile`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
};

// Products
export const productAPI = {
  getAll: (params = '') => fetch(`${API_URL}/products?${params}`, { headers: getHeaders() }).then(handleResponse),
  getOne: (id) => fetch(`${API_URL}/products/${id}`, { headers: getHeaders() }).then(handleResponse),
  getMyProducts: (params = '') => fetch(`${API_URL}/products/supplier/my-products?${params}`, { headers: getHeaders() }).then(handleResponse),
  create: (formData) => fetch(`${API_URL}/products`, { method: 'POST', headers: getAuthHeaders(), body: formData }).then(handleResponse),
  update: (id, formData) => fetch(`${API_URL}/products/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: formData }).then(handleResponse),
  delete: (id) => fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
};

// Orders
export const orderAPI = {
  create: (data) => fetch(`${API_URL}/orders`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  getAll: (params = '') => fetch(`${API_URL}/orders?${params}`, { headers: getHeaders() }).then(handleResponse),
  getOne: (id) => fetch(`${API_URL}/orders/${id}`, { headers: getHeaders() }).then(handleResponse),
  updateStatus: (id, status) => fetch(`${API_URL}/orders/${id}/status`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status }) }).then(handleResponse),
};

// Reviews
export const reviewAPI = {
  create: (data) => fetch(`${API_URL}/reviews`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  getSupplierReviews: (supplierId, params = '') => fetch(`${API_URL}/reviews/supplier/${supplierId}?${params}`).then(handleResponse),
};

// Complaints
export const complaintAPI = {
  create: (data) => fetch(`${API_URL}/complaints`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  getAll: (params = '') => fetch(`${API_URL}/complaints?${params}`, { headers: getHeaders() }).then(handleResponse),
  resolve: (id, data) => fetch(`${API_URL}/complaints/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
};

// Supplier
export const supplierAPI = {
  getDashboard: () => fetch(`${API_URL}/supplier/dashboard`, { headers: getHeaders() }).then(handleResponse),
  getProfile: (id) => fetch(`${API_URL}/supplier/profile/${id}`).then(handleResponse),
};

// Admin
export const adminAPI = {
  getDashboard: () => fetch(`${API_URL}/admin/dashboard`, { headers: getHeaders() }).then(handleResponse),
  getUsers: (params = '') => fetch(`${API_URL}/admin/users?${params}`, { headers: getHeaders() }).then(handleResponse),
  verifySupplier: (id) => fetch(`${API_URL}/admin/users/${id}/verify`, { method: 'PUT', headers: getHeaders() }).then(handleResponse),
  getOrders: (params = '') => fetch(`${API_URL}/admin/orders?${params}`, { headers: getHeaders() }).then(handleResponse),
  getComplaints: (params = '') => fetch(`${API_URL}/admin/complaints?${params}`, { headers: getHeaders() }).then(handleResponse),
};

// Notifications
export const notificationAPI = {
  getAll: (params = '') => fetch(`${API_URL}/notifications?${params}`, { headers: getHeaders() }).then(handleResponse),
  markAsRead: (id) => fetch(`${API_URL}/notifications/${id}/read`, { method: 'PUT', headers: getHeaders() }).then(handleResponse),
  markAllAsRead: () => fetch(`${API_URL}/notifications/read-all`, { method: 'PUT', headers: getHeaders() }).then(handleResponse),
};
