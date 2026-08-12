import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { CollectionScheduleQueryDto } from './dto/collection-schedule-query.dto';
import { CollectionSchedulesService } from './collection-schedules.service';

@ApiTags('Jadwal Pengangkutan Rutin')
@Controller({ path: 'collection-schedules', version: '1' })
export class CollectionSchedulesController {
  constructor(private readonly service: CollectionSchedulesService) {}

  @Get()
  @Public()
  @ApiOkResponse({ description: 'Jadwal rutin yang diterbitkan pengelola layanan wilayah' })
  list(@Query() query: CollectionScheduleQueryDto) {
    return this.service.list(query);
  }
}
