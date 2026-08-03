import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import { CreateWeighingReceiptDto } from './dto/create-weighing-receipt.dto';
import { PriceBoardQueryDto } from './dto/price-board-query.dto';
import { WeighingReceiptsService } from './weighing-receipts.service';

@ApiTags('Bukti Timbang & Papan Harga')
@ApiBearerAuth()
@Controller({ path: 'weighing-receipts', version: '1' })
export class WeighingReceiptsController {
  constructor(private readonly service: WeighingReceiptsService) {}

  @Post()
  @Roles('WASTE_AGENT')
  @ApiOkResponse({ description: 'Menerbitkan bukti timbang baru (Waste Agent)' })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWeighingReceiptDto) {
    return this.service.create(user.id, dto);
  }

  /**
   * Papan harga sengaja tidak dibatasi peran. Informasi harga adalah kebutuhan
   * paling mendesak bagi pemulung, termasuk yang belum terverifikasi sama
   * sekali (Tingkat 0), sehingga menguncinya di balik verifikasi akan
   * menghapus manfaat utamanya justru bagi yang paling membutuhkan.
   */
  @Get('price-board')
  @ApiOkResponse({
    description:
      'Sebaran harga per grade di satu wilayah, dihitung dari bukti timbang bernomor tera',
  })
  async priceBoard(@Query() query: PriceBoardQueryDto) {
    return this.service.getPriceBoard(query);
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
}
