import { Module } from '@nestjs/common';

import { AgentVerificationsModule } from '../agent-verifications/agent-verifications.module';
import { MemberCardsController } from './member-cards.controller';
import { MemberCardsService } from './member-cards.service';

@Module({
  imports: [AgentVerificationsModule],
  controllers: [MemberCardsController],
  providers: [MemberCardsService],
  exports: [MemberCardsService],
})
export class MemberCardsModule {}
