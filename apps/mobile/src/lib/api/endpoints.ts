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
    /** Radar pemulung: jarak + arah + umur permintaan. */
    radar: '/api/v1/pickup-requests/radar',
    assigned: '/api/v1/pickup-requests/assigned',
    byId: (id: string) => `/api/v1/pickup-requests/${id}`,
    accept: (id: string) => `/api/v1/pickup-requests/${id}/accept`,
    /** ACCEPTED → IN_PROGRESS. */
    start: (id: string) => `/api/v1/pickup-requests/${id}/start`,
    /** ACCEPTED|IN_PROGRESS → PENDING, agen dilepas. */
    release: (id: string) => `/api/v1/pickup-requests/${id}/release`,
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
  weighing: {
    root: '/api/v1/weighing-receipts',
    mine: '/api/v1/weighing-receipts/mine',
    priceBoard: '/api/v1/weighing-receipts/price-board',
    /** Publik — dipakai autocomplete wilayah pada papan harga. */
    regions: '/api/v1/weighing-receipts/regions',
    byId: (id: string) => `/api/v1/weighing-receipts/${id}`,
  },
  dropPoints: {
    /** Publik — alasannya sama seperti papan harga: paling dibutuhkan justru
     *  oleh orang yang baru memindai dan belum punya akun. */
    nearby: '/api/v1/drop-points/nearby',
    byRegion: '/api/v1/drop-points',
  },
  memberCards: {
    root: '/api/v1/member-cards',
    lookup: '/api/v1/member-cards/lookup',
    status: (id: string) => `/api/v1/member-cards/${id}/status`,
    uid: (id: string) => `/api/v1/member-cards/${id}/uid`,
  },
  uploads: {
    image: '/api/v1/uploads/image',
  },
  health: '/health',
} as const;
