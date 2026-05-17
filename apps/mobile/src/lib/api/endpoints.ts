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
  pickups: {
    root: '/api/v1/pickup-requests',
    mine: '/api/v1/pickup-requests/mine',
    nearby: '/api/v1/pickup-requests/nearby',
    assigned: '/api/v1/pickup-requests/assigned',
    byId: (id: string) => `/api/v1/pickup-requests/${id}`,
    accept: (id: string) => `/api/v1/pickup-requests/${id}/accept`,
    complete: (id: string) => `/api/v1/pickup-requests/${id}/complete`,
    cancel: (id: string) => `/api/v1/pickup-requests/${id}/cancel`,
  },
  reports: {
    root: '/api/v1/reports',
    mine: '/api/v1/reports/mine',
    byId: (id: string) => `/api/v1/reports/${id}`,
    verify: (id: string) => `/api/v1/reports/${id}/verify`,
    resolve: (id: string) => `/api/v1/reports/${id}/resolve`,
  },
  marketplace: {
    items: '/api/v1/marketplace/items',
    itemById: (id: string) => `/api/v1/marketplace/items/${id}`,
    checkout: '/api/v1/marketplace/checkout',
    myTransactions: '/api/v1/marketplace/transactions/mine',
  },
  uploads: {
    image: '/api/v1/uploads/image',
  },
  health: '/health',
} as const;
