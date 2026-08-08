// API Client for Amble Engineering
const API_BASE = ''; // Empty = same domain (works on localhost AND render)

async function api(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const opts = {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
    };
    if (opts.body && typeof opts.body === 'object') {
        opts.body = JSON.stringify(opts.body);
    }
    
    try {
        const res = await fetch(url, opts);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return data;
    } catch (err) {
        console.error('API Error:', err.message);
        throw err;
    }
}

// Auth helpers
function getToken() { return localStorage.getItem('amble_token'); }
function getAdminToken() { return localStorage.getItem('amble_admin_token'); }
function setToken(t) { localStorage.setItem('amble_token', t); }
function setAdminToken(t) { localStorage.setItem('amble_admin_token', t); }

// API Methods
const AuthAPI = {
    register: (d) => api('/api/register', { method: 'POST', body: d }),
    login: (d) => api('/api/login', { method: 'POST', body: d }),
    adminLogin: (d) => api('/api/admin/login', { method: 'POST', body: d })
};

const ProductAPI = {
    getAll: () => api('/api/products'),
    add: (d) => api('/api/products', { method: 'POST', body: d, headers: { 'Authorization': `Bearer ${getAdminToken()}` } }),
    update: (id, d) => api(`/api/products/${id}`, { method: 'PUT', body: d, headers: { 'Authorization': `Bearer ${getAdminToken()}` } }),
    delete: (id) => api(`/api/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getAdminToken()}` } })
};

const OrderAPI = {
    create: (d) => api('/api/orders', { method: 'POST', body: d }),
    getMine: (uid) => api(`/api/orders/my/${uid}`),
    getAll: () => api('/api/orders', { headers: { 'Authorization': `Bearer ${getAdminToken()}` } }),
    updateStatus: (id, status) => api(`/api/orders/${id}/status`, { 
        method: 'PUT', body: { status }, headers: { 'Authorization': `Bearer ${getAdminToken()}` } 
    })
};