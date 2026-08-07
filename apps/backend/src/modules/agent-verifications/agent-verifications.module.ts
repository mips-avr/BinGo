import { Module } from '@nestjs/common';
import { AgentVerificationsController } from './agent-verifications.controller';
import { AgentVerificationsService } from './agent-verifications.service';

/**
 * Modul ini diekspor karena dua modul lain menegakkan tingkat verifikasi:
 * PickupRequestsModule (menerima pekerjaan) dan WeighingReceiptsModule
 * (menerbitkan bukti timbang). Keduanya cukup memanggil `assertCanAcceptJobs`
 * dan `assertCanIssueReceipt`, sehingga aturan penjenjangan hanya tertulis di
 * satu tempat.
 */
@Module({
  controllers: [AgentVerificationsController],
  providers: [AgentVerificationsService],
  exports: [AgentVerificationsService],
})
export class AgentVerificationsModule {}
