import { Platform } from 'react-native';

export interface CardCredential { credential: string; source: 'ANDROID_NFC' | 'SIMULATOR' | 'MANUAL'; }
export interface CardReaderAdapter { readonly label: string; read(): Promise<CardCredential | null>; }

export class DemoCardReader implements CardReaderAdapter {
  readonly label = 'Simulator Kartu Demo';
  constructor(private readonly cardNumber = 'BG-DEMO-0001') {}
  async read() { return { credential: this.cardNumber, source: 'SIMULATOR' as const }; }
}

export class ManualCardNumberReader implements CardReaderAdapter {
  readonly label = 'Nomor Kartu';
  constructor(private readonly cardNumber: string) {}
  async read() { const credential = this.cardNumber.trim().toUpperCase(); return credential ? { credential, source: 'MANUAL' as const } : null; }
}

export function isAndroidNfcAvailable(): boolean { return Platform.OS === 'android'; }
