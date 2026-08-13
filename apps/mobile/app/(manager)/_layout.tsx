import { Slot } from 'expo-router';
import { WebShell } from '../../src/components/pivot/WebShell';
const nav = [
  { label: 'Ringkasan', href: '/(manager)', icon: 'grid' },
  { label: 'Wilayah dan Pelanggan', href: '/(manager)/customers', icon: 'map' },
  { label: 'Tagihan', href: '/(manager)/billing', icon: 'credit-card' },
  { label: 'Kalender dan Rute', href: '/(manager)/routes', icon: 'calendar' },
  { label: 'Petugas dan Kartu', href: '/(manager)/collectors', icon: 'users' },
  { label: 'Timbang dan Pemilahan', href: '/(manager)/weighing', icon: 'archive' },
  { label: 'Material', href: '/(manager)/materials', icon: 'package' },
  { label: 'Pesanan', href: '/(manager)/orders', icon: 'shopping-bag' },
  { label: 'Fasilitas', href: '/(manager)/facilities', icon: 'map-pin' },
  { label: 'Laporan', href: '/(manager)/reports', icon: 'alert-circle' },
  { label: 'Bantuan', href: '/(manager)/help', icon: 'help-circle' },
  { label: 'Pengaturan', href: '/(manager)/settings', icon: 'settings' },
] as const;
export default function ManagerLayout() {
  return (
    <WebShell
      allowedRoles={['MANAGER_ADMIN', 'MANAGER_OPERATOR']}
      nav={[...nav]}
      title="Dashboard Pengelola"
    >
      <Slot />
    </WebShell>
  );
}
