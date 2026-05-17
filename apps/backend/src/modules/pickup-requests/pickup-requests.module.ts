import { Module } from '@nestjs/common';
import { PointsModule } from '../points/points.module';
import { PickupRequestsController } from './pickup-requests.controller';
import { PickupRequestsService } from './pickup-requests.service';

@Module({
  imports: [PointsModule],
  controllers: [PickupRequestsController],
  providers: [PickupRequestsService],
  exports: [PickupRequestsService],
})
export class PickupRequestsModule {}
