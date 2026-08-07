import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { LatLng } from '@bingo/shared-types';
import { getCurrentLocation, watchLocation, type LocationWatcher } from '../lib/location';
import { t } from '../i18n';

export interface AgentLocationState {
  /** Posisi mentah — untuk menampilkan koordinat dan membuka aplikasi peta. */
  coords: LatLng | null;
  /**
   * Posisi yang sudah dibulatkan ke ~11 meter, KHUSUS untuk kunci React Query.
   *
   * GPS ponsel bergeser beberapa meter tiap pembacaan meski penggunanya diam.
   * Memakai koordinat mentah sebagai bagian kunci kueri membuat setiap
   * pembacaan melahirkan entri cache baru: daftar berkedip kosong tiap kali
   * posisi diperbarui, dan satu permintaan jaringan terkirim untuk setiap
   * getaran GPS — mahal pada paket data terbatas yang dipakai pengguna sasaran.
   */
  queryCoords: LatLng | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Ketelitian kunci kueri: 4 desimal ≈ 11 meter di khatulistiwa.
 *
 * Cukup halus sehingga pemulung yang benar-benar berpindah blok mendapat hasil
 * baru, cukup kasar sehingga diam di tempat berarti satu kunci saja.
 */
const QUERY_PRECISION = 1e4;

export function quantizeCoord(value: number): number {
  return Math.round(value * QUERY_PRECISION) / QUERY_PRECISION;
}

function quantize(coords: LatLng): LatLng {
  return { lat: quantizeCoord(coords.lat), lng: quantizeCoord(coords.lng) };
}

/**
 * Posisi pemulung yang benar-benar hidup.
 *
 * Versi sebelumnya memanggil `getCurrentPositionAsync` sekali saat mount,
 * sementara kueri permintaan terdekat menyegarkan diri tiap 30 detik. Akibatnya
 * pemulung yang sedang berkeliling terus mendapat jarak yang dihitung dari
 * titik tempat ia membuka layar — makin jauh ia berjalan, makin salah radarnya,
 * tanpa satu pun tanda di layar bahwa angkanya sudah basi.
 *
 * Sekarang posisi diikuti dengan `watchPositionAsync`, dan langganannya dilepas
 * saat komponen dilepas.
 *
 * Di dalam tab pemulung, JANGAN memanggil hook ini langsung — pakai
 * `useSharedAgentLocation()` agar hanya ada satu langganan GPS untuk seluruh
 * aplikasi.
 */
export function useAgentLocation(): AgentLocationState {
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [queryCoords, setQueryCoords] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const watcher = useRef<LocationWatcher | null>(null);
  const mounted = useRef(true);

  const apply = useCallback((next: LatLng) => {
    if (!mounted.current) return;
    setCoords(next);
    // `queryCoords` hanya berubah identitasnya ketika nilai bulatnya benar-benar
    // berbeda, sehingga kueri tidak ikut dijalankan ulang oleh derau GPS.
    setQueryCoords((previous) => {
      const rounded = quantize(next);
      if (previous && previous.lat === rounded.lat && previous.lng === rounded.lng) {
        return previous;
      }
      return rounded;
    });
  }, []);

  const start = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Satu pembacaan cepat lebih dulu: `watchPositionAsync` bisa perlu
      // beberapa detik sampai pembacaan pertamanya keluar, dan selama itu
      // layar tidak boleh kosong tanpa penjelasan.
      const first = await getCurrentLocation();
      apply(first.coords);
      watcher.current?.remove();
      watcher.current = null;
      const subscription = await watchLocation(apply);
      if (!mounted.current) {
        subscription.remove();
        return;
      }
      watcher.current = subscription;
    } catch (e) {
      if (mounted.current) {
        setError(e instanceof Error ? e.message : t.pickup.locationFailed);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    mounted.current = true;
    start();
    return () => {
      mounted.current = false;
      watcher.current?.remove();
      watcher.current = null;
    };
  }, [start]);

  return { coords, queryCoords, loading, error, refresh: start };
}

// ─── Sumber tunggal untuk seluruh tab pemulung ───────────────

const AgentLocationContext = createContext<AgentLocationState | null>(null);

/**
 * Menyediakan satu langganan GPS untuk seluruh tab pemulung.
 *
 * Sebelumnya dashboard dan layar radar masing-masing memanggil
 * `useAgentLocation()` sendiri. Dua langganan GPS berjalan bersamaan, dua kali
 * permintaan izin, dan — karena keduanya nyaris pasti memperoleh koordinat
 * mentah yang berbeda beberapa meter — dua entri cache terpisah untuk data yang
 * sama persis.
 */
export function AgentLocationProvider({ children }: { children: ReactNode }) {
  const value = useAgentLocation();
  return createElement(AgentLocationContext.Provider, { value }, children);
}

/** Posisi pemulung bersama. Hanya sah di dalam `AgentLocationProvider`. */
export function useSharedAgentLocation(): AgentLocationState {
  const shared = useContext(AgentLocationContext);
  if (!shared) {
    throw new Error(
      'useSharedAgentLocation dipakai di luar AgentLocationProvider. ' +
        'Bungkus layarnya di app/(agent-tabs)/_layout.tsx.',
    );
  }
  return shared;
}
