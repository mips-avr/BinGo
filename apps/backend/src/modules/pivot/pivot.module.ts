import { Module } from '@nestjs/common';
import { PivotService } from './pivot.service';
import { MockPaymentProvider } from './providers';
import { PrivateVerificationEvidenceStore } from './verification-evidence-store.service';
import {
  ApplicationsController,
  PlatformController,
  PivotOperationsController,
} from './pivot.controller';
import {
  BusinessCrudController,
  ManagerCrudController,
  PlatformManagementController,
} from './crud.controller';
import { PivotCrudService } from './crud.service';

@Module({
  controllers: [
    ApplicationsController,
    PlatformController,
    PivotOperationsController,
    ManagerCrudController,
    BusinessCrudController,
    PlatformManagementController,
  ],
  providers: [
    PivotService,
    PivotCrudService,
    { provide: 'PAYMENT_PROVIDER', useClass: MockPaymentProvider },
    { provide: 'VERIFICATION_EVIDENCE_STORE', useClass: PrivateVerificationEvidenceStore },
  ],
})
export class PivotModule {}
