import { Module } from '@nestjs/common';
import { AgentVerificationsModule } from '../agent-verifications/agent-verifications.module';
import { WeighingReceiptsController } from './weighing-receipts.controller';
import { WeighingReceiptsService } from './weighing-receipts.service';

@Module({
  imports: [AgentVerificationsModule],
  controllers: [WeighingReceiptsController],
  providers: [WeighingReceiptsService],
  exports: [WeighingReceiptsService],
})
export class WeighingReceiptsModule {}
