import { secureStorage } from '../../lib/storage/secure';

const QUEUE_KEY = 'bingo.encryptedEventQueue.v1';

export interface QueuedDeviceEvent {
  deviceEventId: string;
  kind: 'CARD_TAP' | 'WEIGHT_EVENT' | 'STOP_UPDATE';
  payload: Record<string, unknown>;
  queuedAt: string;
}

export async function readEncryptedQueue(): Promise<QueuedDeviceEvent[]> {
  const value = await secureStorage.get(QUEUE_KEY);
  if (!value) return [];
  try { return JSON.parse(value) as QueuedDeviceEvent[]; } catch { return []; }
}

export async function enqueueEncryptedEvent(event: QueuedDeviceEvent): Promise<void> {
  const queue = await readEncryptedQueue();
  if (queue.some((item) => item.deviceEventId === event.deviceEventId)) return;
  await secureStorage.set(QUEUE_KEY, JSON.stringify([...queue, event].slice(-200)));
}

export async function replaceEncryptedQueue(events: QueuedDeviceEvent[]): Promise<void> {
  await secureStorage.set(QUEUE_KEY, JSON.stringify(events));
}

export async function synchronizeEncryptedQueue(
  send: (event: QueuedDeviceEvent) => Promise<{ result?: 'accepted' | 'duplicate' | 'rejected' }>,
): Promise<{ accepted: number; duplicate: number; rejected: number; remaining: number }> {
  const queue = await readEncryptedQueue();
  const remaining: QueuedDeviceEvent[] = [];
  const result = { accepted: 0, duplicate: 0, rejected: 0, remaining: 0 };
  for (const event of queue) {
    try {
      const response = await send(event);
      if (response.result === 'duplicate') result.duplicate += 1;
      else if (response.result === 'rejected') result.rejected += 1;
      else result.accepted += 1;
    } catch {
      remaining.push(event);
    }
  }
  await replaceEncryptedQueue(remaining);
  result.remaining = remaining.length;
  return result;
}
