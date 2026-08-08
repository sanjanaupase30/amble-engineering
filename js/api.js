// API Base URL
const API_URL = window.location.origin; // Automatically uses current domain

// Helper for API calls
async function api(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Something went wrong');
    return data;
}

// Auth API
const AuthAPI = {
    register: (userData) => api('/api/register', { method: 'POST', body: JSON.stringify(userData) }),
    login: (credentials) => api('/api/login', { method: 'POST', body: JSON.stringify(credentials) }),
    adminLogin: (credentials) => api('/api/admin/login', { method: 'POST', body: JSON.stringify(credentials) })
};

// Product API
const ProductAPI = {
    getAll: () => api('/api/products'),
    add: (product, token) => api('/api/products', { 
        method: 'POST', 
        body: JSON.stringify(product),
        headers: { 'Authorization': `Bearer ${token}` }
    }),
    update: (id, product, token) => api(`/api/products/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(product),
        headers: { 'Authorization': `Bearer ${token}` }
    }),
    delete: (id, token) => api(`/api/products/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
};

// Order API
const OrderAPI = {
    create: (orderData) => api('/api/orders', { method: 'POST', body: JSON.stringify(orderData) }),
    getMyOrders: (userId) => api(`/api/orders/my/${userId}`),
    getAll: (token) => api('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
    updateStatus: (orderId, status, token) => api(`/api/orders/${orderId}/status`, { 
        method: 'PUT', 
        body: JSON.stringify({ status }),
        headers: { 'Authorization': `Bearer ${token}` }
    })
};