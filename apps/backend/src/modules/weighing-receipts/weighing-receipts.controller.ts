import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import { CreateWeighingReceiptDto } from './dto/create-weighing-receipt.dto';
import { DisputeWeighingReceiptDto } from './dto/dispute-weighing-receipt.dto';
import { PriceBoardQueryDto } from './dto/price-board-query.dto';
import { WeighingReceiptsService } from './weighing-receipts.service';

@ApiTags('Bukti Timbang & Papan Harga')
@ApiBearerAuth()
@Controller({ path: 'weighing-receipts', version: '1' })
export class WeighingReceiptsController {
  constructor(private readonly service: WeighingReceiptsService) {}

  @Post()
  @Roles('WASTE_AGENT')
  @ApiCreatedResponse({ description: 'Menerbitkan bukti timbang baru (Waste Agent)' })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWeighingReceiptDto) {
    return this.service.create(user.id, dto);
  }

  /**
   * Papan harga sengaja terbuka tanpa autentikasi.
   *
   * Informasi harga adalah kebutuhan paling mendesak bagi pemulung, termasuk
   * yang belum terverifikasi sama sekali dan belum punya akun (Tingkat 0).
   * Mengunci papan harga di balik pendaftaran menghapus manfaat utamanya
   * justru bagi yang paling membutuhkan, sekaligus membalik urutannya: harga
   * menjadi imbalan atas pendaftaran, padahal justru harga yang membuat orang
   * mau mendaftar.
   *
   * Yang dibuka hanyalah agregat — persentil per grade per wilayah, dengan
   * ambang minimum sampel dan mitra. Tidak ada identitas penyetor, nomor
   * bukti, atau nilai transaksi perorangan yang dapat dibaca dari sini.
   */
  @Public()
  @Get('price-board')
  @ApiOkResponse({
    description:
      'Sebaran harga per grade di satu wilayah, dihitung dari bukti timbang bernomor tera. Terbuka tanpa token.',
  })
  async priceBoard(@Query() query: PriceBoardQueryDto) {
    return this.service.getPriceBoard(query);
  }

  /**
   * Daftar wilayah untuk autocomplete papan harga. Ikut terbuka tanpa token:
   * papan harga publik yang daftar wilayahnya terkunci tidak dapat dipakai —
   * pengguna tanpa akun tidak akan tahu wilayah mana yang punya data dan harus
   * menebak ejaannya.
   */
  @Public()
  @Get('regions')
  @ApiOkResponse({
    description:
      'Wilayah yang sudah memiliki bukti timbang, untuk autocomplete papan harga. Terbuka tanpa token.',
  })
  async regions() {
    return this.service.listRegions();
  }

  @Get('mine')
  @ApiOkResponse({ description: 'Bukti timbang di mana pengguna menjadi penyetor atau penerbit' })
  async listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listForUser(user.id);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detail satu bukti timbang (hanya penyetor dan penerbit)' })
  async getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.getByIdForUser(id, user);
  }

  /**
   * Sengaja tanpa `@Roles`: penyetor bisa warga maupun pemulung lain yang
   * menyetor ke lapak. Yang menentukan siapa boleh mempersoalkan adalah
   * kepemilikan bukti, bukan peran — dan itu diperiksa di service.
   */
  @Patch(':id/dispute')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Penyetor mempersoalkan bukti timbang. Bukti tidak dihapus; ia berhenti dihitung sebagai transaksi nirsengketa penerbitnya.',
  })
  async dispute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: DisputeWeighingReceiptDto,
  ) {
    return this.service.dispute(id, user.id, dto.reason);
  }
}
