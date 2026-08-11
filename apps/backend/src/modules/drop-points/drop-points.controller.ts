import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { DropPointsService } from './drop-points.service';
import { NearbyDropPointQueryDto } from './dto/nearby-drop-point-query.dto';

@ApiTags('Titik Setor')
@Controller({ path: 'drop-points', version: '1' })
export class DropPointsController {
  constructor(private readonly service: DropPointsService) {}

  /**
   * Terbuka tanpa autentikasi, dengan alasan yang sama seperti papan harga.
   *
   * Orang yang paling butuh tahu ke mana membawa sampahnya adalah orang yang
   * baru saja memindainya dan belum punya akun. Mewajibkan pendaftaran di
   * titik itu berarti menutup satu-satunya fitur yang berguna bagi pendatang
   * baru — dan tidak ada apa pun di sini yang bersifat pribadi.
   */
  @Get('nearby')
  @Public()
  @ApiOkResponse({ description: 'Titik setor terdekat, diurutkan menurut jarak' })
  async nearby(@Query() query: NearbyDropPointQueryDto) {
    return this.service.findNearby(query);
  }

  @Get()
  @Public()
  @ApiQuery({ name: 'region', required: true })
  @ApiQuery({ name: 'material', required: false })
  @ApiOkResponse({ description: 'Titik setor pada satu wilayah' })
  async byRegion(@Query('region') region: string, @Query('material') material?: string) {
    return this.service.listByRegion(region ?? '', material as never);
  }
}
