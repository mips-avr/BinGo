import { Module } from '@nestjs/common';
import { WeighingReceiptsController } from './weighing-receipts.controller';
import { WeighingReceiptsService } from './weighing-receipts.service';

@Module({
  controllers: [WeighingReceiptsController],
  providers: [WeighingReceiptsService],
  exports: [WeighingReceiptsService],
})
export class WeighingReceiptsModule {}
