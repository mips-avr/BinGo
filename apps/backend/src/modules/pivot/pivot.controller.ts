import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import {
  CardTapDto,
  CreateCollectionRouteDto,
  CreateCollectionRunDto,
  CreateCollectorDto,
  CreateIntakeBatchDto,
  CreateLotDto,
  CreateOrderDto,
  CreateRequirementDto,
  CreateWeightEventDto,
  CreateWasteReportDto,
  IssueCollectorCardDto,
  MockPaymentDto,
  ReceiveOrderDto,
  ResolveReportDto,
  ReviewReasonDto,
  UpdateApplicationDto,
  UpdateStopDto,
  UpsertFacilityDto,
} from './dto/pivot.dto';
import { PivotService } from './pivot.service';

@ApiTags('Organization applications')
@ApiBearerAuth()
@Controller({ path: 'organization-applications', version: '1' })
export class ApplicationsController {
  constructor(private readonly service: PivotService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser) {
    return this.service.myApplication(user.id);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.myOrganizationProfile(user.id);
  }

  @Patch('mine')
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateApplicationDto) {
    return this.service.updateMyApplication(user.id, dto);
  }

  @Post('mine/documents')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { label: { type: 'string' }, file: { type: 'string', format: 'binary' } },
      required: ['label', 'file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 4 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        callback(
          allowed.includes(file.mimetype)
            ? null
            : new BadRequestException('Dokumen harus PDF, JPEG, PNG, atau WebP'),
          allowed.includes(file.mimetype),
        );
      },
    }),
  )
  document(
    @CurrentUser() user: AuthenticatedUser,
    @Body('label') label: string,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true })) file: Express.Multer.File,
  ) {
    return this.service.addDocument(user.id, { label, file });
  }

  @Get('documents/:id')
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const document = await this.service.readDocument(user, id);
    response.setHeader('Content-Type', document.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="verification-${id}"`);
    response.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(document.bytes);
  }

  @Delete('mine/documents/:id')
  removeDocument(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.removeDocument(user.id, id);
  }

  @Post('mine/submit')
  submit(@CurrentUser() user: AuthenticatedUser) {
    return this.service.submitMyApplication(user.id);
  }
}

@ApiTags('Platform governance')
@ApiBearerAuth()
@Roles('PLATFORM_ADMIN')
@Controller({ path: 'platform', version: '1' })
export class PlatformController {
  constructor(private readonly service: PivotService) {}

  @Get('dashboard') dashboard() {
    return this.service.platformDashboard();
  }
  @Get('applications') applications(@Query('status') status?: string) {
    return this.service.listApplications(status);
  }
  @Get('applications/:id') application(@Param('id') id: string) {
    return this.service.applicationDetail(id);
  }
  @Post('applications/:id/approve') approve(
    @CurrentUser() u: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewReasonDto,
  ) {
    return this.service.reviewApplication(u.id, id, 'APPROVED', dto.reason);
  }
  @Post('applications/:id/request-changes') changes(
    @CurrentUser() u: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewReasonDto,
  ) {
    return this.service.reviewApplication(u.id, id, 'CHANGES_REQUESTED', dto.reason);
  }
  @Post('applications/:id/reject') reject(
    @CurrentUser() u: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewReasonDto,
  ) {
    return this.service.reviewApplication(u.id, id, 'REJECTED', dto.reason);
  }
  @Get('organizations') organizations() {
    return this.service.listOrganizations();
  }
  @Post('organizations/:id/suspend') suspend(
    @CurrentUser() u: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewReasonDto,
  ) {
    return this.service.setSuspension(u.id, id, true, dto.reason);
  }
  @Post('organizations/:id/reactivate') reactivate(
    @CurrentUser() u: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewReasonDto,
  ) {
    return this.service.setSuspension(u.id, id, false, dto.reason);
  }
  @Get('facilities') facilities(@Query('archived') archived?: string) {
    return this.service.platformFacilities(archived === 'true');
  }
  @Post('facilities') createFacility(
    @CurrentUser() u: AuthenticatedUser,
    @Body() dto: UpsertFacilityDto,
  ) {
    return this.service.createFacility(u.id, dto);
  }
  @Patch('facilities/:id') updateFacility(
    @CurrentUser() u: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpsertFacilityDto,
  ) {
    return this.service.updateFacility(u.id, id, dto);
  }
  @Post('facilities/:id/verify') verifyFacility(
    @CurrentUser() u: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { sourceUrl: string; note?: string },
  ) {
    return this.service.verifyFacility(u.id, id, body);
  }
  @Post('facilities/:id/archive') archiveFacility(
    @CurrentUser() u: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewReasonDto,
  ) {
    return this.service.archivePlatformFacility(u.id, id, dto.reason, false);
  }
  @Post('facilities/:id/restore') restoreFacility(
    @CurrentUser() u: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewReasonDto,
  ) {
    return this.service.archivePlatformFacility(u.id, id, dto.reason, true);
  }
  @Get('moderation') moderation() {
    return this.service.moderationQueue();
  }
  @Post('moderation/:resourceType/:id/hide') hide(
    @CurrentUser() u: AuthenticatedUser,
    @Param('resourceType') type: string,
    @Param('id') id: string,
    @Body() dto: ReviewReasonDto,
  ) {
    return this.service.moderate(u.id, type, id, true, dto.reason);
  }
  @Post('moderation/:resourceType/:id/restore') restore(
    @CurrentUser() u: AuthenticatedUser,
    @Param('resourceType') type: string,
    @Param('id') id: string,
  ) {
    return this.service.moderate(u.id, type, id, false);
  }
  @Get('audit-events') audit() {
    return this.service.auditEvents();
  }
}

@ApiTags('Pivot operations')
@ApiBearerAuth()
@Controller({ path: 'pivot', version: '1' })
export class PivotOperationsController {
  constructor(private readonly service: PivotService) {}

  @Get('dashboard') dashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.service.roleDashboard(user);
  }
  @Roles('HOUSEHOLD') @Get('household/service') household(@CurrentUser() user: AuthenticatedUser) {
    return this.service.householdService(user.id);
  }
  @Roles('HOUSEHOLD') @Post('invoices/:id/pay') pay(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: MockPaymentDto,
  ) {
    return this.service.payInvoice(user.id, id, dto);
  }
  @Roles('COLLECTOR') @Get('collector/today') collectorToday(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.collectorToday(user.id);
  }
  @Roles('COLLECTOR') @Patch('collector/stops/:id') stop(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateStopDto,
  ) {
    return this.service.updateStop(user.id, id, dto);
  }
  @Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR', 'COLLECTOR') @Post('cards/tap') cardTap(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CardTapDto,
  ) {
    return this.service.cardTap(user.id, dto);
  }
  @Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR') @Get('manager/operations') manager(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.managerOperations(user.id);
  }
  @Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR') @Post('manager/routes') createRoute(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCollectionRouteDto,
  ) {
    return this.service.createCollectionRoute(user.id, dto);
  }
  @Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR') @Post('manager/runs') createRun(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCollectionRunDto,
  ) {
    return this.service.createCollectionRun(user.id, dto);
  }
  @Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR') @Patch('manager/runs/:id') updateRun(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { scheduledFor?: string; action?: 'cancel'; reason?: string },
  ) {
    return this.service.updateCollectionRun(user.id, id, body);
  }
  @Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR') @Post('manager/subscriptions') createSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { householdId: string; servicePlanId: string; startsAt?: string },
  ) {
    return this.service.createSubscription(user.id, body);
  }
  @Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR')
  @Patch('manager/subscriptions/:id')
  updateSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { servicePlanId?: string; action?: 'stop'; reason?: string },
  ) {
    return this.service.updateSubscription(user.id, id, body);
  }
  @Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR') @Post('manager/invoices') createInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { subscriptionId: string; period: string; amount: number; dueAt: string },
  ) {
    return this.service.createInvoice(user.id, body);
  }
  @Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR') @Patch('manager/invoices/:id') updateInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { amount?: number; dueAt?: string; action?: 'void'; reason?: string },
  ) {
    return this.service.updateInvoice(user.id, id, body);
  }
  @Roles('MANAGER_ADMIN') @Post('manager/collectors') createCollector(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCollectorDto,
  ) {
    return this.service.createCollector(user.id, dto);
  }
  @Roles('MANAGER_ADMIN') @Post('manager/collectors/:id/cards') issueCollectorCard(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: IssueCollectorCardDto,
  ) {
    return this.service.issueCollectorCard(user.id, id, dto);
  }
  @Roles('MANAGER_ADMIN')
  @Post('manager/collectors/:collectorId/cards/:cardId/deactivate')
  deactivateCollectorCard(
    @CurrentUser() user: AuthenticatedUser,
    @Param('collectorId') collectorId: string,
    @Param('cardId') cardId: string,
    @Body() dto: ReviewReasonDto,
  ) {
    return this.service.deactivateCollectorCard(user.id, collectorId, cardId, dto.reason);
  }
  @Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR') @Post('weight-events') weight(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWeightEventDto,
  ) {
    return this.service.createWeightEvent(user.id, dto);
  }
  @Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR') @Post('manager/intake-batches') intakeBatch(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateIntakeBatchDto,
  ) {
    return this.service.createIntakeBatch(user.id, dto);
  }
  @Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR') @Post('intake-batches/:id/approve') approveBatch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.approveBatch(user.id, id);
  }
  @Roles('BUSINESS_BUYER') @Get('business/catalog') catalog(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.businessCatalog(user.id);
  }
  @Roles('BUSINESS_BUYER') @Post('business/requirements') requirement(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRequirementDto,
  ) {
    return this.service.createRequirement(user.id, dto);
  }
  @Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR') @Post('manager/lots') lot(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLotDto,
  ) {
    return this.service.createLot(user.id, dto);
  }
  @Roles('BUSINESS_BUYER') @Post('business/orders') order(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.service.createOrder(user.id, dto);
  }
  @Roles('BUSINESS_BUYER') @Post('business/orders/:id/cancel') cancelBusinessOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewReasonDto,
  ) {
    return this.service.cancelBusinessOrder(user.id, id, dto.reason);
  }
  @Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR')
  @Post('manager/orders/:id/:action')
  managerOrderAction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('action') action: 'confirm' | 'cancel',
    @Body() dto: ReviewReasonDto,
  ) {
    return this.service.managerOrderAction(user.id, id, action, dto.reason);
  }
  @Roles('BUSINESS_BUYER') @Post('business/orders/:id/receive') receive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReceiveOrderDto,
  ) {
    return this.service.receiveOrder(user.id, id, dto);
  }
  @Get('facilities') facilities(@Query('material') material?: string) {
    return this.service.facilities(material);
  }
  @Get('reports') reports(@CurrentUser() user: AuthenticatedUser) {
    return this.service.myReports(user.id);
  }
  @Roles('HOUSEHOLD') @Post('reports') createReport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWasteReportDto,
  ) {
    return this.service.createReport(user.id, dto);
  }
  @Roles('HOUSEHOLD') @Patch('reports/:id') updateReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateWasteReportDto,
  ) {
    return this.service.updateReport(user.id, id, dto);
  }
  @Roles('HOUSEHOLD') @Post('reports/:id/withdraw') withdrawReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewReasonDto,
  ) {
    return this.service.withdrawReport(user.id, id, dto.reason);
  }
  @Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR') @Post('reports/:id/status') reportStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { status: string; note?: string },
  ) {
    return this.service.updateReportStatus(user.id, id, body.status, body.note);
  }
  @Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR') @Post('reports/:id/resolve') resolve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.service.resolveReport(user.id, id, dto.note);
  }
}
