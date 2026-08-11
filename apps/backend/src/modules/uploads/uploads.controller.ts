import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  ParseFilePipe,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { put } from '@vercel/blob';
import { memoryStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Request } from 'express';
import { UPLOADS_DIR, USES_BLOB_STORAGE } from './uploads.constants';

/**
 * Daftar putih jenis berkas beserta ekstensi yang dipakai server.
 *
 * Ekstensi berkas TIDAK PERNAH diambil dari `file.originalname`. Nama berkas
 * itu sepenuhnya ditentukan klien, sementara berkas yang tersimpan disajikan
 * kembali sebagai berkas statis di `/uploads/`. Mengambil ekstensinya dari
 * klien berarti siapa pun yang boleh mengunggah dapat menyimpan `jahat.html`
 * pada domain backend, lalu mengirimkan tautannya: berkas itu akan disajikan
 * sebagai HTML dan skrip di dalamnya berjalan pada origin backend — stored XSS
 * yang sekaligus menjangkau token siapa pun yang membuka tautan tersebut.
 *
 * Memvalidasi `mimetype` saja tidak cukup, karena `mimetype` juga dikirim
 * klien: `evil.html` cukup diberi mimetype `image/png` untuk lolos. Kuncinya
 * adalah ekstensi yang tersimpan ditentukan server dari daftar ini, sehingga
 * berkas apa pun yang berhasil masuk akan tersimpan dan tersaji sebagai gambar.
 */
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
};

const ALLOWED_MIME = Object.keys(MIME_TO_EXTENSION);
// Vercel Function membatasi seluruh request body pada 4,5 MB. Sisakan ruang
// untuk multipart boundary dan header agar pengguna mendapat 400 yang jelas,
// bukan 413 dari edge sebelum request mencapai NestJS.
const MAX_BYTES = 4 * 1024 * 1024;

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller({ path: 'uploads', version: '1' })
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  @Post('image')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiCreatedResponse({ description: 'Mengunggah foto (jpeg/png/webp/heic, maks 4MB)' })
  @UseInterceptors(
    FileInterceptor('file', {
      // Memory storage diperlukan agar buffer yang sama dapat dikirim ke
      // Vercel Blob. Batas 4 MB mencegah satu request menghabiskan memory
      // Function secara tidak terkendali.
      storage: memoryStorage(),
      limits: { fileSize: MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          cb(new BadRequestException('Hanya gambar (jpeg/png/webp/heic) yang diizinkan'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(
    @Req() req: Request,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
  ): Promise<{ url: string; filename: string; size: number; mimeType: string }> {
    const ext = MIME_TO_EXTENSION[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Hanya gambar (jpeg/png/webp/heic) yang diizinkan');
    }

    // Nama tidak pernah berasal dari originalname milik klien.
    const filename = `${Date.now()}-${randomUUID()}${ext}`;
    let url: string;

    if (USES_BLOB_STORAGE) {
      const blob = await put(`reports/${filename}`, file.buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: file.mimetype,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      url = blob.url;
    } else {
      await writeFile(join(UPLOADS_DIR, filename), file.buffer);
      const baseUrl =
        process.env.PUBLIC_BASE_URL?.replace(/\/+$/, '') ??
        `${req.protocol}://${req.headers.host ?? 'localhost'}`;
      url = `${baseUrl}/uploads/${filename}`;
    }

    this.logger.log(
      `Foto disimpan ke ${USES_BLOB_STORAGE ? 'Vercel Blob' : 'disk lokal'}: ${filename} (${file.size} bytes)`,
    );
    return {
      url,
      filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}
