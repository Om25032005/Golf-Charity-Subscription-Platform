import axios from 'axios';

// In production (Vercel), VITE_API_URL will be the full backend URL (e.g., https://my-backend.onrender.com/api)
// In local dev, it falls back to '/api' which uses the Vite proxy
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// ─── Request Interceptor: Attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 ────────────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            const path = window.location.pathname;
            if (path !== '/login' && path !== '/signup') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    changePassword: (data) => api.patch('/auth/change-password', data),
};

// ─── Charities ────────────────────────────────────────────────────────────────
export const charityAPI = {
    getAll: () => api.get('/charities'),
    getById: (id) => api.get(`/charities/${id}`),
};

// ─── Scores ───────────────────────────────────────────────────────────────────
export const scoreAPI = {
    getMyScores: () => api.get('/scores/my'),
    submitScore: (score) => api.post('/scores', { score }),
    updateScore: (scoreId, score) => api.put(`/scores/${scoreId}`, { score }),
    deleteScore: (scoreId) => api.delete(`/scores/${scoreId}`),
};

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptionAPI = {
    getStatus: () => api.get('/subscriptions/status'),
    createCheckout: (plan) => api.post('/subscriptions/checkout', { plan }),
    createPortal: () => api.post('/subscriptions/portal'),
    sync: () => api.post('/subscriptions/sync'),
};

// ─── Draws ────────────────────────────────────────────────────────────────────
export const drawAPI = {
    getHistory: (page = 1) => api.get(`/draws?page=${page}`),
    getLatest: () => api.get('/draws/latest'),
    getMyResults: () => api.get('/draws/my-results'),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
    // Dashboard
    getStats: () => api.get('/admin/dashboard-stats'),
    // Users
    getUsers: (page = 1, filters = {}) =>
        api.get('/admin/users', { params: { page, ...filters } }),
    getUserById: (id) => api.get(`/admin/users/${id}`),
    toggleUserStatus: (id) => api.patch(`/admin/users/${id}/status`),
    promoteUser: (id) => api.patch(`/admin/users/${id}/promote`),
    // Charities
    createCharity: (data) => api.post('/admin/charities', data),
    updateCharity: (id, data) => api.patch(`/admin/charities/${id}`, data),
    deleteCharity: (id) => api.delete(`/admin/charities/${id}`),
    // Draws
    runDraw: (data) => api.post('/admin/draws/run', data),
    // Winners
    getWinners: (status = 'pending') =>
        api.get('/admin/winners', { params: { status } }),
    verifyWinner: (id, data) => api.patch(`/admin/winners/${id}/verify`, data),
};

// ─── Winner Proof Upload ──────────────────────────────────────────────────────
export const winnerAPI = {
    uploadProof: (winnerId, file) => {
        const formData = new FormData();
        formData.append('proof', file);
        return api.post(`/winners/${winnerId}/upload-proof`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

export default api;
