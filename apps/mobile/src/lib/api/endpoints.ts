/**
 * Pusat definisi endpoint REST. Memudahkan perubahan path saat
 * versi API naik (mis. `/api/v2/...`).
 */
export const ENDPOINTS = {
  auth: {
    register: '/api/v1/auth/register',
    login: '/api/v1/auth/login',
    me: '/api/v1/auth/me',
  },
  users: {
    me: '/api/v1/users/me',
  },
  health: '/health',
} as const;
