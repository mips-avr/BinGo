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
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsQueryDto } from './dto/list-reports-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Post()
  @Roles('CITIZEN')
  @ApiOkResponse({ description: 'Membuat laporan pembuangan ilegal (warga)' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReportDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  @ApiOkResponse({ description: 'Daftar laporan publik (semua peran)' })
  list(@Query() query: ListReportsQueryDto) {
    return this.service.list(query);
  }

  @Get('mine')
  @Roles('CITIZEN')
  @ApiOkResponse({ description: 'Laporan milik warga yang sedang login' })
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMine(user.id);
  }

  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.getById(id);
  }

  @Patch(':id/verify')
  @Roles('CITIZEN', 'WASTE_AGENT')
  @HttpCode(HttpStatus.OK)
  verify(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.verify(id, user);
  }

  @Patch(':id/resolve')
  @Roles('CITIZEN', 'WASTE_AGENT')
  @HttpCode(HttpStatus.OK)
  resolve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.resolve(id, user);
  }
}
