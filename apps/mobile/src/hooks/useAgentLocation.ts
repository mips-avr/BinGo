import { useCallback, useEffect, useState } from 'react';
import type { LatLng } from '@bingo/shared-types';
import { getCurrentLocation } from '../lib/location';

export interface AgentLocationState {
  coords: LatLng | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/** Lokasi pemulung untuk query `/pickup-requests/nearby`. */
export function useAgentLocation(): AgentLocationState {
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCurrentLocation();
      setCoords(res.coords);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengambil lokasi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { coords, loading, error, refresh };
}
