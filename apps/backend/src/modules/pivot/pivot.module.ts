import { Module } from '@nestjs/common';
import { PivotService } from './pivot.service';
import { MockPaymentProvider } from './providers';
import { PrivateVerificationEvidenceStore } from './verification-evidence-store.service';
import {
  ApplicationsController,
  PlatformController,
  PivotOperationsController,
} from './pivot.controller';

@Module({
  controllers: [ApplicationsController, PlatformController, PivotOperationsController],
  providers: [
    PivotService,
    { provide: 'PAYMENT_PROVIDER', useClass: MockPaymentProvider },
    { provide: 'VERIFICATION_EVIDENCE_STORE', useClass: PrivateVerificationEvidenceStore },
  ],
})
export class PivotModule {}
