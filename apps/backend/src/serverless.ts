import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { AppModule } from './app.module';
import { configureApp } from './app.factory';

type ExpressLike = (req: IncomingMessage, res: ServerResponse) => void;

/**
 * Entry point serverless untuk Vercel.
 *
 * Perbedaan yang menentukan dibanding `main.ts`: di sini dipanggil `app.init()`,
 * bukan `app.listen()`. Runtime Vercel yang menerima koneksi HTTP; aplikasi
 * hanya menyediakan handler. Memanggil `listen()` di lingkungan ini membuat
 * fungsi menggantung sampai timeout tanpa pernah menjawab satu permintaan pun.
 *
 * Promise-nya di-cache di lingkup modul, bukan di dalam handler. Vercel
 * memakai ulang instance yang sama untuk permintaan berikutnya selama masih
 * hangat, jadi Nest hanya di-bootstrap sekali per instance — inilah beda antara
 * cold start ~2 detik satu kali dan ~2 detik pada SETIAP permintaan.
 *
 * Yang di-cache adalah promise-nya, bukan hasilnya, supaya dua permintaan yang
 * datang bersamaan saat cold start tidak mem-bootstrap dua aplikasi sekaligus.
 */
let cached: Promise<ExpressLike> | null = null;

async function createHandler(): Promise<ExpressLike> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Serverless menulis ke stdout yang jadi log Vercel. 'debug' dibuang supaya
    // log tidak tenggelam oleh keluaran bootstrap pada setiap cold start.
    logger: ['log', 'warn', 'error'],
  });

  configureApp(app);
  await app.init();

  return app.getHttpAdapter().getInstance() as unknown as ExpressLike;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (!cached) {
    cached = createHandler().catch((err) => {
      // Jangan biarkan promise yang gagal ter-cache selamanya: satu kegagalan
      // sementara (mis. database belum siap) akan membuat SELURUH instance itu
      // menolak permintaan sampai Vercel mendaur ulangnya.
      cached = null;
      throw err;
    });
  }

  const app = await cached;
  app(req, res);
}
