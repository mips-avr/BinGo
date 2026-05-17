import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemsService } from './items.service';

@ApiTags('Marketplace')
@ApiBearerAuth()
@Controller({ path: 'marketplace/items', version: '1' })
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get()
  @ApiOkResponse({ description: 'Daftar produk WasteMart' })
  list(@Query('search') search?: string) {
    return this.items.list(search);
  }

  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.items.getById(id);
  }

  /**
   * Phase 3 — endpoint create dibuka untuk MSME agar bisa menambahkan produk
   * mereka sendiri (mis. supplier kemasan ramah lingkungan).
   */
  @Post()
  @Roles('MSME')
  @ApiOkResponse({ description: 'Menambahkan produk baru (MSME)' })
  create(@Body() dto: CreateItemDto) {
    return this.items.create(dto);
  }
}
