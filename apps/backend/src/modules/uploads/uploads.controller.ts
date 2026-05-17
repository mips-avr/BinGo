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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { UPLOADS_DIR } from './uploads.constants';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
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
  @ApiOkResponse({ description: 'Mengunggah foto (jpeg/png/webp/heic, maks 5MB)' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname || '').toLowerCase() || '.jpg';
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
