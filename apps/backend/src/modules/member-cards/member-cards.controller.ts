import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsString, Matches } from 'class-validator';

import type { MemberCardStatus } from '@bingo/shared-types';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import { CardLookupQueryDto } from './dto/card-lookup-query.dto';
import { IssueMemberCardDto } from './dto/issue-member-card.dto';
import { MemberCardsService } from './member-cards.service';

class SetCardStatusDto {
  @IsEnum(['AKTIF', 'DIBEKUKAN', 'HILANG'], { message: 'Status kartu tidak dikenal' })
  status!: MemberCardStatus;
}

class AttachUidDto {
  @IsString()
  @Matches(/^[0-9A-Fa-f]{8,32}$/, { message: 'UID kartu harus heksadesimal 8–32 karakter' })
  uid!: string;
}

@ApiTags('Kartu Mitra')
@ApiBearerAuth()
@Controller({ path: 'member-cards', version: '1' })
export class MemberCardsController {
  constructor(private readonly service: MemberCardsService) {}

  @Post()
  @Roles('WASTE_AGENT')
  @ApiCreatedResponse({ description: 'Menerbitkan Kartu Mitra beserta akun pemegangnya' })
  async issue(@CurrentUser() user: AuthenticatedUser, @Body() dto: IssueMemberCardDto) {
    return this.service.issue(user.id, dto);
  }

  /**
   * Dibaca di konter ketika kartu ditempel.
   *
   * Tetap butuh token — berbeda dari papan harga dan direktori titik setor.
   * Yang dikembalikan di sini adalah riwayat transaksi seseorang, dan itu milik
   * orang tersebut, bukan informasi publik.
   */
  @Get('lookup')
  @Roles('WASTE_AGENT')
  @ApiOkResponse({ description: 'Mengenali pemegang kartu dan ringkasan riwayatnya' })
  async lookup(@CurrentUser() user: AuthenticatedUser, @Query() query: CardLookupQueryDto) {
    return this.service.lookup(user.id, query);
  }

  @Get()
  @Roles('WASTE_AGENT')
  @ApiOkResponse({ description: 'Kartu yang diterbitkan akun ini' })
  async listIssued(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listIssued(user.id);
  }

  @Patch(':id/status')
  @Roles('WASTE_AGENT')
  @ApiOkResponse({ description: 'Membekukan atau mengaktifkan kembali kartu' })
  async setStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: SetCardStatusDto,
  ) {
    return this.service.setStatus(user.id, id, dto.status);
  }

  @Patch(':id/uid')
  @Roles('WASTE_AGENT')
  @ApiOkResponse({ description: 'Memasangkan chip NFC ke kartu yang sudah terdaftar' })
  async attachUid(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: AttachUidDto,
  ) {
    return this.service.attachUid(user.id, id, dto.uid);
  }
}
