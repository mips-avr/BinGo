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
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import { AgentVerificationsService } from './agent-verifications.service';
import { DecideAttestationDto } from './dto/decide-attestation.dto';
import { EndorseAgentDto } from './dto/endorse-agent.dto';
import { RequestAttestationDto } from './dto/request-attestation.dto';

/**
 * Verifikasi berjenjang pemulung.
 *
 * Seluruh endpoint di sini berperan WASTE_AGENT karena penjenjangan ini memang
 * hanya berlaku bagi pemulung. Akun operator mitra (bank sampah, lapak, TPS3R,
 * KSM persampahan, RT/RW) juga berperan WASTE_AGENT dan dibedakan oleh kolom
 * `partner_type`/`partner_name` pada tabel users, yang tidak dapat disetel dari
 * aplikasi.
 */
@ApiTags('Verifikasi Berjenjang Pemulung')
@ApiBearerAuth()
@Controller({ path: 'agent-verifications', version: '1' })
export class AgentVerificationsController {
  constructor(private readonly service: AgentVerificationsService) {}

  @Post()
  @Roles('WASTE_AGENT')
  @ApiCreatedResponse({
    description: 'Pemulung mengajukan penjaminan kepada satu mitra terdaftar (status MENUNGGU)',
  })
  async request(@CurrentUser() user: AuthenticatedUser, @Body() dto: RequestAttestationDto) {
    return this.service.requestAttestation(user.id, dto);
  }

  @Get('mine')
  @Roles('WASTE_AGENT')
  @ApiOkResponse({
    description:
      'Tingkat verifikasi pemulung yang sedang login, angka yang mendasarinya, dan seluruh penjaminan beserta jejak auditnya',
  })
  async mine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getStatusFor(user.id);
  }

  @Get('inbox')
  @Roles('WASTE_AGENT')
  @ApiOkResponse({
    description: 'Pengajuan penjaminan yang ditujukan kepada akun operator mitra ini',
  })
  async inbox(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listInbox(user.id);
  }

  @Patch(':id/decide')
  @Roles('WASTE_AGENT')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Mitra menyetujui, menolak, atau mencabut satu penjaminan. Tingkat pemulung dihitung ulang seketika.',
  })
  async decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: DecideAttestationDto,
  ) {
    return this.service.decide(id, user.id, dto);
  }

  @Post('endorsements')
  @Roles('WASTE_AGENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Pemulung Tingkat 2 merekomendasikan pemulung lain (syarat ketiga Tingkat 2)',
  })
  async endorse(@CurrentUser() user: AuthenticatedUser, @Body() dto: EndorseAgentDto) {
    return this.service.endorse(user.id, dto);
  }
}
