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
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { UPLOADS_DIR } from './uploads.constants';

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
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

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
  @ApiCreatedResponse({ description: 'Mengunggah foto (jpeg/png/webp/heic, maks 5MB)' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
          // Nama berkas sepenuhnya ditentukan server: waktu, UUID acak, dan
          // ekstensi dari daftar putih. `file.originalname` diabaikan
          // seluruhnya — termasuk ekstensinya dan kemungkinan `../` di
          // dalamnya.
          const ext = MIME_TO_EXTENSION[file.mimetype];
          if (!ext) {
            cb(new BadRequestException('Hanya gambar (jpeg/png/webp/heic) yang diizinkan'), '');
            return;
          }
          cb(null, `${Date.now()}-${randomUUID()}${ext}`);
        },
      }),
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
  uploadImage(
    @Req() req: Request,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
  ) {
    const baseUrl =
      process.env.PUBLIC_BASE_URL?.replace(/\/+$/, '') ??
      `${req.protocol}://${req.headers.host ?? 'localhost'}`;
    const url = `${baseUrl}/uploads/${file.filename}`;
    this.logger.log(`Foto disimpan: ${file.filename} (${file.size} bytes)`);
    return {
      url,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}
