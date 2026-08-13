import { randomUUID } from 'node:crypto';

export interface PaymentResult {
  provider: string;
  reference: string;
  status: 'SUCCEEDED' | 'FAILED';
}
export interface PaymentProvider {
  charge(input: { amount: number; method: string; idempotencyKey: string }): Promise<PaymentResult>;
}
export class MockPaymentProvider implements PaymentProvider {
  async charge(): Promise<PaymentResult> {
    return {
      provider: 'MOCK',
      reference: `DEMO-PAY-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: 'SUCCEEDED',
    };
  }
}
export interface VerificationEvidenceStore {
  save(input: {
    applicationId: string;
    filename: string;
    mimeType: string;
    bytes: Buffer;
  }): Promise<{ storageKey: string }>;
  read(storageKey: string): Promise<{ bytes: Buffer; mimeType: string } | null>;
  remove?(storageKey: string): Promise<void>;
}
