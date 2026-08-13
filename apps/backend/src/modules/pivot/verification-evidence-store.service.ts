import { Injectable } from '@nestjs/common';
import { del, get, put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import type { VerificationEvidenceStore } from './providers';

const PRIVATE_PREFIX = 'verification-evidence';
const LOCAL_PREFIX = 'local-private:';

function localDirectory(): string {
  if (process.env.PRIVATE_EVIDENCE_DIR) return resolve(process.env.PRIVATE_EVIDENCE_DIR);
  const cwd = process.cwd();
  return cwd.endsWith('apps/backend')
    ? resolve(cwd, 'uploads', 'private-verification')
    : resolve(cwd, 'apps', 'backend', 'uploads', 'private-verification');
}

@Injectable()
export class PrivateVerificationEvidenceStore implements VerificationEvidenceStore {
  async save(input: { applicationId: string; filename: string; mimeType: string; bytes: Buffer }) {
    const safeName =
      basename(input.filename)
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .slice(-100) || 'document';
    const pathname = `${PRIVATE_PREFIX}/${input.applicationId}/${randomUUID()}-${safeName}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(pathname, input.bytes, {
        access: 'private',
        addRandomSuffix: false,
        contentType: input.mimeType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return { storageKey: blob.pathname };
    }

    const root = localDirectory();
    await mkdir(root, { recursive: true });
    const localName = `${randomUUID()}-${safeName}`;
    await writeFile(resolve(root, localName), input.bytes, { mode: 0o600 });
    return { storageKey: `${LOCAL_PREFIX}${localName}` };
  }

  async read(storageKey: string): Promise<{ bytes: Buffer; mimeType: string } | null> {
    if (storageKey.startsWith(LOCAL_PREFIX)) {
      const name = basename(storageKey.slice(LOCAL_PREFIX.length));
      if (!name) return null;
      try {
        return {
          bytes: await readFile(resolve(localDirectory(), name)),
          mimeType: 'application/octet-stream',
        };
      } catch {
        return null;
      }
    }

    if (!storageKey.startsWith(`${PRIVATE_PREFIX}/`) || !process.env.BLOB_READ_WRITE_TOKEN)
      return null;
    const result = await get(storageKey, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      useCache: false,
    });
    if (!result || result.statusCode !== 200) return null;
    const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
    return { bytes, mimeType: result.blob.contentType };
  }

  async remove(storageKey: string): Promise<void> {
    if (storageKey.startsWith(LOCAL_PREFIX)) {
      const name = basename(storageKey.slice(LOCAL_PREFIX.length));
      if (!name) return;
      await unlink(resolve(localDirectory(), name)).catch(() => undefined);
      return;
    }
    if (storageKey.startsWith(`${PRIVATE_PREFIX}/`) && process.env.BLOB_READ_WRITE_TOKEN) {
      await del(storageKey, { token: process.env.BLOB_READ_WRITE_TOKEN });
    }
  }
}
