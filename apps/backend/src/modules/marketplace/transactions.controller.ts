import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import { CheckoutDto } from './dto/checkout.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('Marketplace')
@ApiBearerAuth()
@Controller({ path: 'marketplace', version: '1' })
export class TransactionsController {
  constructor(private readonly tx: TransactionsService) {}

  @Post('checkout')
  @Roles('MSME')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ description: 'Checkout keranjang (mock payment) — MSME only' })
  checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutDto) {
    return this.tx.checkout(user.id, dto);
  }

  @Get('transactions/mine')
  @Roles('MSME')
  @ApiOkResponse({ description: 'Riwayat transaksi MSME yang sedang login' })
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.tx.listMine(user.id);
  }
}
