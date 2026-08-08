import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Pembacaan UID kartu NFC, dengan penurunan kemampuan yang disengaja.
 *
 * Modul ini TIDAK boleh membuat aplikasi gagal dijalankan ketika NFC tidak ada.
 * Ada tiga keadaan berbeda yang semuanya harus berakhir pada aplikasi yang
 * tetap berjalan, dan membedakannya penting karena pesannya ke petugas berbeda:
 *
 *   1. Modul nativenya tidak terpasang sama sekali — misalnya di Expo Go, di
 *      harness tangkapan layar berbasis web, atau di lingkungan pengujian.
 *   2. Modulnya ada tetapi perangkat kerasnya tidak punya NFC.
 *   3. Perangkat kerasnya ada tetapi NFC sedang dimatikan pengguna.
 *
 * Ketiganya diselesaikan dengan satu jalan yang sama: nomor kartu diketik
 * manual, dan hasilnya sama persis. Itu sebabnya nomor kartu wajib tercetak di
 * kartunya. Sistem yang hanya bisa dipakai lewat NFC akan berhenti bekerja pada
 * hari chip-nya rusak — dan pada hari itu seseorang tidak bisa menjual.
 *
 * `require` sengaja dilakukan malas dan dibungkus try/catch, bukan `import`
 * statis di kepala berkas. Impor statis modul native membuat seluruh bundel
 * gagal dimuat di lingkungan yang tidak memilikinya, dan itu akan menjatuhkan
 * layar-layar lain yang tidak ada hubungannya dengan kartu.
 */
export type NfcAvailability = 'memeriksa' | 'siap' | 'mati' | 'tidak-didukung';

interface NfcManagerLike {
  start: () => Promise<void>;
  isSupported: () => Promise<boolean>;
  isEnabled: () => Promise<boolean>;
  requestTechnology: (tech: unknown) => Promise<unknown>;
  getTag: () => Promise<{ id?: string } | null>;
  cancelTechnologyRequest: () => Promise<void>;
}

interface NfcModule {
  manager: NfcManagerLike;
  ndefTech: unknown;
}

let cached: NfcModule | null | undefined;

function loadNfc(): NfcModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-nfc-manager');
    const manager = (mod.default ?? mod) as NfcManagerLike;
    if (!manager || typeof manager.isSupported !== 'function') {
      cached = null;
      return cached;
    }
    cached = { manager, ndefTech: mod.NfcTech?.Ndef ?? 'Ndef' };
  } catch {
    cached = null;
  }
  return cached;
}

/** Normalisasi UID ke heksadesimal huruf besar tanpa pemisah. */
export function normalizeTagId(raw: string): string {
  return raw.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
}

export interface UseNfcTagResult {
  availability: NfcAvailability;
  reading: boolean;
  error: string | null;
  /** `null` bila dibatalkan atau gagal; pemanggil beralih ke entri manual. */
  readTag: () => Promise<string | null>;
  cancel: () => void;
}

export function useNfcTag(): UseNfcTagResult {
  const [availability, setAvailability] = useState<NfcAvailability>('memeriksa');
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;

    (async () => {
      const nfc = loadNfc();
      // Web dan iOS Simulator tidak pernah punya NFC; jangan repot memanggil.
      if (!nfc || Platform.OS === 'web') {
        if (!cancelled) setAvailability('tidak-didukung');
        return;
      }
      try {
        const supported = await nfc.manager.isSupported();
        if (!supported) {
          if (!cancelled) setAvailability('tidak-didukung');
          return;
        }
        await nfc.manager.start();
        // `isEnabled` hanya bermakna di Android; iOS tidak punya saklar NFC.
        const enabled = Platform.OS === 'android' ? await nfc.manager.isEnabled() : true;
        if (!cancelled) setAvailability(enabled ? 'siap' : 'mati');
      } catch {
        if (!cancelled) setAvailability('tidak-didukung');
      }
    })();

    return () => {
      cancelled = true;
      mounted.current = false;
      const nfc = loadNfc();
      // Sesi teknologi yang tidak ditutup membuat pembacaan berikutnya
      // menggantung tanpa pesan galat — termasuk setelah layar ini ditinggalkan.
      nfc?.manager.cancelTechnologyRequest().catch(() => undefined);
    };
  }, []);

  const cancel = useCallback(() => {
    const nfc = loadNfc();
    nfc?.manager.cancelTechnologyRequest().catch(() => undefined);
    if (mounted.current) setReading(false);
  }, []);

  const readTag = useCallback(async (): Promise<string | null> => {
    const nfc = loadNfc();
    if (!nfc) return null;

    setError(null);
    setReading(true);
    try {
      await nfc.manager.requestTechnology(nfc.ndefTech);
      const tag = await nfc.manager.getTag();
      const id = tag?.id ? normalizeTagId(tag.id) : '';
      if (!id) {
        setError('Kartu terbaca tetapi tidak punya nomor chip. Ketik nomor kartunya.');
        return null;
      }
      return id;
    } catch {
      // Pembatalan oleh pengguna dan kegagalan baca sampai lewat jalur yang
      // sama, dan tidak dapat dibedakan dengan andal lintas platform. Jangan
      // menampilkan galat menakutkan untuk sesuatu yang mungkin hanya "batal".
      return null;
    } finally {
      await nfc.manager.cancelTechnologyRequest().catch(() => undefined);
      if (mounted.current) setReading(false);
    }
  }, []);

  return { availability, reading, error, readTag, cancel };
}
