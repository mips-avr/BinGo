/**
 * English fallback locale (for developer tooling only).
 * Bahasa Indonesia tetap menjadi bahasa default produk.
 */
import type { TranslationDict } from './id';

export const en: TranslationDict = {
  common: {
    appName: 'BinGo',
    tagline: 'Small actions for a cleaner Indonesia',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    retry: 'Retry',
    error: 'An error occurred',
    success: 'Success',
  },
  auth: {
    login: 'Sign in',
    register: 'Sign up',
    logout: 'Sign out',
    phone: 'Phone number',
    password: 'Password',
    name: 'Full name',
    nik: 'NIK (National ID)',
    chooseRole: 'Choose your role',
    role: {
      CITIZEN: 'Citizen',
      WASTE_AGENT: 'Waste Agent',
      MSME: 'MSME',
    },
  },
  pickup: {
    title: 'Pickup Requests',
    create: 'Create Request',
    nearby: 'Nearby Requests',
    accept: 'Accept',
    complete: 'Complete',
    cancel: 'Cancel',
    status: {
      PENDING: 'Pending',
      ACCEPTED: 'Accepted',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    },
  },
  report: {
    title: 'Illegal Dumping Reports',
    create: 'Report',
    status: {
      DILAPORKAN: 'Reported',
      DIVERIFIKASI: 'Verified',
      SELESAI: 'Resolved',
    },
  },
  marketplace: {
    title: 'WasteMart',
    cart: 'Cart',
    checkout: 'Checkout',
    addToCart: 'Add to Cart',
    minOrder: 'Minimum order',
    stock: 'Stock',
  },
  points: {
    label: 'TrashLink Points',
    earned: 'You earned {amount} points',
  },
  scanner: {
    title: 'TrashScan',
    instruction: 'Point the camera at the recycling symbol on the packaging',
    result: {
      material: 'Material type',
      disposal: 'Disposal instructions',
      points: 'Point value',
    },
  },
};
