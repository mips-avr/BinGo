import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  controllers: [ItemsController, TransactionsController],
  providers: [ItemsService, TransactionsService],
  exports: [ItemsService, TransactionsService],
})
export class MarketplaceModule {}
