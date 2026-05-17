import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import { CreatePickupDto } from './dto/create-pickup.dto';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import { PickupRequestsService } from './pickup-requests.service';

@ApiTags('Pickup Requests')
@ApiBearerAuth()
@Controller({ path: 'pickup-requests', version: '1' })
export class PickupRequestsController {
  constructor(private readonly service: PickupRequestsService) {}

  // ---------- Warga ----------

  @Post()
  @Roles('CITIZEN')
  @ApiOkResponse({ description: 'Membuat permintaan penjemputan baru (warga)' })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePickupDto) {
    return this.service.createForCitizen(user.id, dto);
  }

  @Get('mine')
  @Roles('CITIZEN')
  @ApiOkResponse({ description: 'Daftar permintaan milik warga yang sedang login' })
  async listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listForCitizen(user.id);
  }

  // ---------- Pemulung ----------

  @Get('nearby')
  @Roles('WASTE_AGENT')
  @ApiOkResponse({ description: 'Permintaan PENDING dalam radius tertentu (pemulung)' })
  async nearby(@Query() query: NearbyQueryDto) {
    return this.service.findNearby(query);
  }

  @Get('assigned')
  @Roles('WASTE_AGENT')
  @ApiOkResponse({ description: 'Pekerjaan yang sudah dipegang oleh pemulung' })
  async assigned(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listForAgent(user.id);
  }

  // ---------- Detail (akses berbasis kepemilikan) ----------

  @Get(':id')
  @ApiOkResponse({ description: 'Detail satu permintaan (akses dicek berdasarkan peran)' })
  async getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.getByIdForUser(id, user);
  }

  // ---------- Transisi status ----------

  @Patch(':id/accept')
  @Roles('WASTE_AGENT')
  @HttpCode(HttpStatus.OK)
  async accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.accept(id, user.id);
  }

  @Patch(':id/complete')
  @Roles('WASTE_AGENT')
  @HttpCode(HttpStatus.OK)
  async complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.complete(id, user.id);
  }

  @Patch(':id/cancel')
  @Roles('CITIZEN')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    if (user.role !== 'CITIZEN') {
      throw new ForbiddenException('Hanya warga yang bisa membatalkan permintaannya sendiri');
    }
    return this.service.cancelByCitizen(id, user.id);
  }
}
