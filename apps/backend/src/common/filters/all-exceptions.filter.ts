import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

/**
 * Pemetaan galat Prisma yang diketahui ke status HTTP yang benar.
 *
 * Tanpa pemetaan ini, setiap pelanggaran batasan basis data keluar sebagai
 * HTTP 500, sehingga klien tidak dapat membedakan "data Anda bentrok" dari
 * "server sedang rusak" — dan setiap pelanggaran kunci unik terlihat seperti
 * kegagalan sistem di layar pengguna.
 *
 * Pesan sengaja umum dan tidak menyebut nama kolom: nama batasan adalah detail
 * internal basis data, dan pada tabel seperti `users` menyebutkannya sama saja
 * dengan mengonfirmasi keberadaan sebuah akun kepada pihak yang menebak-nebak.
 */
const PRISMA_ERROR_MAP: Record<string, { status: HttpStatus; message: string }> = {
  /** Pelanggaran batasan unik. */
  P2002: {
    status: HttpStatus.CONFLICT,
    message: 'Data yang sama sudah tercatat sebelumnya',
  },
  /** Baris yang dituju operasi tidak ditemukan. */
  P2025: {
    status: HttpStatus.NOT_FOUND,
    message: 'Data yang dituju tidak ditemukan',
  },
  /** Pelanggaran foreign key: pemanggil merujuk baris yang tidak ada. */
  P2003: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Data yang dirujuk tidak ditemukan',
  },
};

/**
 * Filter exception global yang menghasilkan respons error JSON konsisten
 * dengan pesan dalam Bahasa Indonesia.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Terjadi kesalahan pada server';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as { message?: string | string[]; error?: string };
        message = body.message ?? message;
        errorCode = body.error ?? exception.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = PRISMA_ERROR_MAP[exception.code];
      errorCode = exception.code;
      if (mapped) {
        status = mapped.status;
        message = mapped.message;
        // Dicatat sebagai warn, bukan error: pelanggaran batasan yang sering
        // muncul menandakan validasi yang kurang di lapis atasnya, bukan
        // server yang rusak.
        this.logger.warn(`Prisma ${exception.code} pada ${request.url}: ${exception.message}`);
      } else {
        this.logger.error(exception.message, exception.stack);
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      // Bentuk payload tidak sesuai yang diminta Prisma. Ini kesalahan
      // pemanggil, bukan kegagalan server.
      status = HttpStatus.BAD_REQUEST;
      message = 'Permintaan tidak sesuai format yang diharapkan';
      errorCode = 'PRISMA_VALIDATION_ERROR';
      this.logger.warn(`Prisma validation error pada ${request.url}`);
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.error('Unknown exception', JSON.stringify(exception));
    }

    response.status(status).json({
      statusCode: status,
      error: errorCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
