import { Slot } from 'expo-router';
import { WebShell } from '../../src/components/pivot/WebShell';
const nav = [
  { label: 'Ringkasan', href: '/(business)', icon: 'grid' },
  { label: 'Kebutuhan Material', href: '/(business)/requirements', icon: 'clipboard' },
  { label: 'Pasokan', href: '/(business)/supply', icon: 'package' },
  { label: 'Pesanan', href: '/(business)/orders', icon: 'shopping-cart' },
  { label: 'Penerimaan', href: '/(business)/receipts', icon: 'check-circle' },
  { label: 'Riwayat', href: '/(business)/history', icon: 'clock' },
  { label: 'Profil dan Verifikasi', href: '/(business)/profile', icon: 'shield' },
  { label: 'Bantuan', href: '/(business)/help', icon: 'help-circle' },
] as const;
export default function Layout() {
  return (
    <WebShell allowedRoles={['BUSINESS_BUYER']} nav={[...nav]} title="Dashboard Business">
      <Slot />
    </WebShell>
  );
}
