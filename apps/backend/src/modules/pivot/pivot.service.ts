import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  OrganizationReviewDecision,
  OrganizationStatus,
  Prisma,
  PublicationStatus,
  RouteStopStatus,
  MaterialType,
  UserRole,
} from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CardTapDto,
  CreateIntakeBatchDto,
  CreateLotDto,
  CreateOrderDto,
  CreateRequirementDto,
  CreateWeightEventDto,
  MockPaymentDto,
  ReceiveOrderDto,
  UpdateApplicationDto,
  UpdateStopDto,
  UpsertFacilityDto,
  CreateWasteReportDto,
} from './dto/pivot.dto';
import type { PaymentProvider, VerificationEvidenceStore } from './providers';

@Injectable()
export class PivotService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('PAYMENT_PROVIDER') private readonly paymentProvider: PaymentProvider,
    @Inject('VERIFICATION_EVIDENCE_STORE')
    private readonly evidenceStore: VerificationEvidenceStore,
  ) {}

  private async membership(userId: string, types?: Array<'MANAGER' | 'BUSINESS'>) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId, active: true, ...(types ? { organization: { type: { in: types } } } : {}) },
      include: { organization: true },
    });
    if (!membership) throw new ForbiddenException('Keanggotaan organisasi tidak ditemukan');
    return membership;
  }

  private assertOrganizationActive(status: OrganizationStatus): void {
    if (status !== 'ACTIVE') {
      const message =
        status === 'SUSPENDED'
          ? 'Organisasi disuspend. Transaksi baru tidak dapat dibuat.'
          : 'Organisasi belum aktif. Selesaikan verifikasi terlebih dahulu.';
      throw new ForbiddenException(message);
    }
  }

  async myApplication(userId: string) {
    const application = await this.prisma.organizationApplication.findFirst({
      where: { applicantId: userId },
      include: { documents: true, reviews: { orderBy: { createdAt: 'desc' } }, organization: true },
    });
    if (!application) throw new NotFoundException('Pengajuan organisasi tidak ditemukan');
    return application;
  }

  async updateMyApplication(userId: string, dto: UpdateApplicationDto) {
    const application = await this.myApplication(userId);
    if (!['DRAFT', 'CHANGES_REQUESTED'].includes(application.status)) {
      throw new ConflictException('Pengajuan yang sedang ditinjau tidak dapat diubah');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.organizationApplication.update({
        where: { id: application.id },
        data: {
          ...dto,
          version: { increment: application.status === 'CHANGES_REQUESTED' ? 1 : 0 },
        },
      });
      await tx.organization.update({
        where: { id: application.organizationId },
        data: {
          name: dto.organizationName,
          contactName: dto.responsibleName,
          contactPhone: dto.contactPhone,
          address: dto.address,
          status: 'DRAFT',
        },
      });
      return updated;
    });
  }

  async addDocument(userId: string, body: { label: string; file: Express.Multer.File }) {
    const application = await this.myApplication(userId);
    if (!['DRAFT', 'CHANGES_REQUESTED'].includes(application.status)) {
      throw new ConflictException('Dokumen tidak dapat ditambah ketika pengajuan sedang ditinjau');
    }
    if (!body.label?.trim() || !body.file?.buffer || !body.file.mimetype) {
      throw new BadRequestException('Label dan dokumen wajib diisi');
    }
    const stored = await this.evidenceStore.save({
      applicationId: application.id,
      filename: body.file.originalname,
      mimeType: body.file.mimetype,
      bytes: body.file.buffer,
    });
    return this.prisma.verificationDocument.create({
      data: {
        applicationId: application.id,
        uploadedById: userId,
        label: body.label.trim(),
        storageKey: stored.storageKey,
        mimeType: body.file.mimetype,
        demo: false,
      },
    });
  }

  async readDocument(user: AuthenticatedUser, id: string) {
    const document = await this.prisma.verificationDocument.findUnique({
      where: { id },
      include: { application: { select: { applicantId: true } } },
    });
    if (!document) throw new NotFoundException('Dokumen tidak ditemukan');
    const isPlatformAdmin =
      user.platformRoles?.includes('PLATFORM_ADMIN') || user.role === 'PLATFORM_ADMIN';
    if (!isPlatformAdmin && document.application.applicantId !== user.id) {
      throw new ForbiddenException('Anda tidak berhak membuka dokumen ini');
    }
    const content = await this.evidenceStore.read(document.storageKey);
    if (!content) throw new NotFoundException('Isi dokumen tidak tersedia');
    return { ...content, mimeType: document.mimeType, label: document.label };
  }

  async submitMyApplication(userId: string) {
    const application = await this.myApplication(userId);
    if (!['DRAFT', 'CHANGES_REQUESTED'].includes(application.status)) {
      throw new ConflictException('Pengajuan sudah dikirim');
    }
    if (!application.declarationAccepted || application.documents.length === 0) {
      throw new BadRequestException(
        'Pernyataan dan minimal satu dokumen pendukung wajib dilengkapi',
      );
    }
    if (!application.responsibleName || !application.contactPhone || !application.address) {
      throw new BadRequestException('Profil organisasi belum lengkap');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.organizationApplication.update({
        where: { id: application.id },
        data: { status: 'PENDING_REVIEW', submittedAt: new Date() },
      });
      await tx.organization.update({
        where: { id: application.organizationId },
        data: { status: 'PENDING_REVIEW' },
      });
      await tx.organizationReviewEvent.create({
        data: {
          applicationId: application.id,
          version: application.version,
          decision: 'SUBMITTED',
        },
      });
      return updated;
    });
  }

  async platformDashboard() {
    const [pending, active, suspended, documents, facilities, audit] = await Promise.all([
      this.prisma.organizationApplication.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.organization.count({ where: { status: 'ACTIVE' } }),
      this.prisma.organization.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.verificationDocument.count({
        where: { application: { status: 'PENDING_REVIEW' } },
      }),
      this.prisma.facility.count({
        where: { verifiedAt: { lt: new Date(Date.now() - 180 * 86400000) } },
      }),
      this.prisma.auditEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
    ]);
    return {
      role: 'PLATFORM_ADMIN',
      demo: true,
      title: 'Ringkasan Platform',
      metrics: [
        { label: 'Menunggu review', value: String(pending) },
        { label: 'Organisasi aktif', value: String(active) },
        { label: 'Disuspend', value: String(suspended) },
        { label: 'Dokumen diperiksa', value: String(documents) },
        { label: 'Fasilitas kedaluwarsa', value: String(facilities) },
      ],
      tasks: audit.map((event) => ({
        id: event.id,
        title: event.action,
        detail: event.resourceType,
        status: 'Tercatat',
      })),
    };
  }

  listApplications(status?: string) {
    const valid = Object.values(OrganizationStatus).includes(status as OrganizationStatus);
    return this.prisma.organizationApplication.findMany({
      where: valid ? { status: status as OrganizationStatus } : undefined,
      include: {
        organization: true,
        _count: { select: { documents: true } },
        reviews: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: [{ submittedAt: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async applicationDetail(id: string) {
    const value = await this.prisma.organizationApplication.findUnique({
      where: { id },
      include: {
        organization: true,
        applicant: true,
        documents: true,
        reviews: { include: { reviewer: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!value) throw new NotFoundException('Pengajuan tidak ditemukan');
    return value;
  }

  async reviewApplication(
    reviewerId: string,
    id: string,
    decision: Extract<OrganizationReviewDecision, 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED'>,
    reason?: string,
  ) {
    if (decision !== 'APPROVED' && !reason?.trim())
      throw new BadRequestException('Alasan wajib diisi');
    const application = await this.applicationDetail(id);
    if (application.status !== 'PENDING_REVIEW')
      throw new ConflictException('Pengajuan tidak sedang menunggu review');
    const status = decision === 'APPROVED' ? 'ACTIVE' : decision;
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.organizationApplication.update({ where: { id }, data: { status } });
      await tx.organization.update({ where: { id: application.organizationId }, data: { status } });
      await tx.organizationReviewEvent.create({
        data: { applicationId: id, reviewerId, version: application.version, decision, reason },
      });
      await tx.auditEvent.create({
        data: {
          actorId: reviewerId,
          organizationId: application.organizationId,
          action: `ORGANIZATION_${decision}`,
          resourceType: 'OrganizationApplication',
          resourceId: id,
          reason,
        },
      });
      return updated;
    });
  }

  listOrganizations() {
    return this.prisma.organization.findMany({
      include: { _count: { select: { members: true, facilities: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setSuspension(actorId: string, id: string, suspend: boolean, reason?: string) {
    if (suspend && !reason?.trim()) throw new BadRequestException('Alasan suspensi wajib diisi');
    const organization = await this.prisma.organization.findUnique({ where: { id } });
    if (!organization) throw new NotFoundException('Organisasi tidak ditemukan');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.organization.update({
        where: { id },
        data: suspend
          ? { status: 'SUSPENDED', suspensionReason: reason, suspendedAt: new Date() }
          : { status: 'ACTIVE', suspensionReason: null, suspendedAt: null },
      });
      if (suspend) {
        await tx.materialLot.updateMany({
          where: { organizationId: id, status: 'PUBLISHED' },
          data: { status: 'HIDDEN', hiddenReason: reason },
        });
        await tx.businessRequirement.updateMany({
          where: { organizationId: id, status: 'PUBLISHED' },
          data: { status: 'HIDDEN', hiddenReason: reason },
        });
      }
      await tx.auditEvent.create({
        data: {
          actorId,
          organizationId: id,
          action: suspend ? 'ORGANIZATION_SUSPENDED' : 'ORGANIZATION_REACTIVATED',
          resourceType: 'Organization',
          resourceId: id,
          reason,
        },
      });
      return updated;
    });
  }

  facilities(material?: string) {
    const materialFilter = Object.values(MaterialType).includes(material as MaterialType)
      ? { materialRules: { some: { material: material as MaterialType, accepted: true } } }
      : {};
    return this.prisma.facility.findMany({
      where: {
        status: 'ACTIVE',
        ...materialFilter,
      },
      include: { materialRules: true, verifications: { orderBy: { verifiedAt: 'desc' }, take: 1 } },
      orderBy: { verifiedAt: 'desc' },
    });
  }

  async createFacility(actorId: string, dto: UpsertFacilityDto) {
    return this.prisma.$transaction(async (tx) => {
      const facility = await tx.facility.create({
        data: {
          name: dto.name,
          operatorName: dto.operatorName,
          address: dto.address,
          lat: dto.lat,
          lng: dto.lng,
          sourceUrl: dto.sourceUrl,
          openingNote: dto.openingNote,
          verifiedAt: new Date(),
          materialRules: {
            create: dto.materials.map((material) => ({ material, accepted: true })),
          },
        },
        include: { materialRules: true },
      });
      await tx.facilityVerification.create({
        data: { facilityId: facility.id, verifiedBy: actorId, sourceUrl: dto.sourceUrl },
      });
      await tx.auditEvent.create({
        data: {
          actorId,
          action: 'FACILITY_CREATED',
          resourceType: 'Facility',
          resourceId: facility.id,
        },
      });
      return facility;
    });
  }

  async updateFacility(actorId: string, id: string, dto: UpsertFacilityDto) {
    const existing = await this.prisma.facility.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Fasilitas tidak ditemukan');
    return this.prisma.$transaction(async (tx) => {
      await tx.facilityMaterialRule.deleteMany({ where: { facilityId: id } });
      const facility = await tx.facility.update({
        where: { id },
        data: {
          name: dto.name,
          operatorName: dto.operatorName,
          address: dto.address,
          lat: dto.lat,
          lng: dto.lng,
          sourceUrl: dto.sourceUrl,
          openingNote: dto.openingNote,
          materialRules: {
            create: dto.materials.map((material) => ({ material, accepted: true })),
          },
        },
        include: { materialRules: true },
      });
      await tx.auditEvent.create({
        data: {
          actorId,
          action: 'FACILITY_UPDATED',
          resourceType: 'Facility',
          resourceId: id,
        },
      });
      return facility;
    });
  }

  async verifyFacility(actorId: string, id: string, body: { sourceUrl: string; note?: string }) {
    const facility = await this.prisma.facility.findUnique({ where: { id } });
    if (!facility) throw new NotFoundException('Fasilitas tidak ditemukan');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.facility.update({
        where: { id },
        data: { sourceUrl: body.sourceUrl, verifiedAt: new Date() },
      });
      await tx.facilityVerification.create({
        data: { facilityId: id, verifiedBy: actorId, sourceUrl: body.sourceUrl, note: body.note },
      });
      await tx.auditEvent.create({
        data: {
          actorId,
          action: 'FACILITY_VERIFIED',
          resourceType: 'Facility',
          resourceId: id,
          reason: body.note,
        },
      });
      return updated;
    });
  }

  async moderationQueue() {
    const [requirements, lots] = await Promise.all([
      this.prisma.businessRequirement.findMany({
        where: { status: { in: ['PUBLISHED', 'HIDDEN'] } },
        include: { organization: true },
      }),
      this.prisma.materialLot.findMany({
        where: { status: { in: ['PUBLISHED', 'HIDDEN'] } },
        include: { organization: true },
      }),
    ]);
    return { requirements, lots };
  }

  async moderate(actorId: string, type: string, id: string, hidden: boolean, reason?: string) {
    if (hidden && !reason?.trim()) throw new BadRequestException('Alasan moderasi wajib diisi');
    let organizationId: string;
    if (type === 'requirement') {
      const value = await this.prisma.businessRequirement.update({
        where: { id },
        data: { status: hidden ? 'HIDDEN' : 'PUBLISHED', hiddenReason: hidden ? reason : null },
      });
      organizationId = value.organizationId;
    } else if (type === 'lot') {
      const value = await this.prisma.materialLot.update({
        where: { id },
        data: { status: hidden ? 'HIDDEN' : 'PUBLISHED', hiddenReason: hidden ? reason : null },
      });
      organizationId = value.organizationId;
    } else throw new BadRequestException('Jenis publikasi tidak didukung');
    await this.prisma.auditEvent.create({
      data: {
        actorId,
        organizationId,
        action: hidden ? 'PUBLICATION_HIDDEN' : 'PUBLICATION_RESTORED',
        resourceType: type,
        resourceId: id,
        reason,
      },
    });
    return { id, status: hidden ? 'HIDDEN' : 'PUBLISHED' };
  }

  auditEvents() {
    return this.prisma.auditEvent.findMany({
      include: {
        actor: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async roleDashboard(user: AuthenticatedUser) {
    if (
      user.platformRoles?.includes(UserRole.PLATFORM_ADMIN) ||
      user.role === UserRole.PLATFORM_ADMIN
    ) {
      return this.platformDashboard();
    }
    const membership = await this.membership(user.id);
    if (membership.organization.status !== 'ACTIVE') {
      const app = await this.myApplication(user.id).catch(() => null);
      return {
        role: user.role,
        demo: true,
        title: 'Status Verifikasi',
        metrics: [{ label: 'Status', value: membership.organization.status }],
        tasks: [
          {
            id: app?.id ?? 'onboarding',
            title: 'Lengkapi pengajuan organisasi',
            detail:
              app?.reviews?.[0]?.reason ?? 'Profil dan dokumen diperlukan sebelum operasional.',
            status: membership.organization.status,
            href: '/onboarding',
          },
        ],
      };
    }
    if (user.role === UserRole.HOUSEHOLD) return this.householdDashboard(user.id);
    if (user.role === UserRole.COLLECTOR) return this.collectorDashboard(user.id);
    if (user.role === UserRole.BUSINESS_BUYER) return this.businessDashboard(user.id);
    return this.managerDashboard(user.id);
  }

  private async householdDashboard(userId: string) {
    const data = await this.householdService(userId);
    return {
      role: 'HOUSEHOLD',
      demo: true,
      title: `Halo, ${data.household.user?.name ?? 'Warga'}`,
      metrics: [
        {
          label: 'Tagihan aktif',
          value: data.invoice ? `Rp${data.invoice.amount.toLocaleString('id-ID')}` : 'Lunas',
        },
        { label: 'Jadwal berikutnya', value: data.nextCalendar?.title ?? 'Belum dijadwalkan' },
      ],
      tasks: [
        {
          id: data.invoice?.id ?? 'service',
          title: data.invoice ? 'Bayar iuran bulan ini' : 'Layanan aktif',
          detail: data.invoice
            ? `Jatuh tempo ${new Date(data.invoice.dueAt).toLocaleDateString('id-ID')}`
            : 'Tidak ada tagihan tertunda',
          status: data.invoice?.status ?? 'ACTIVE',
          href: '/(tabs)/services',
        },
      ],
    };
  }

  private async collectorDashboard(userId: string) {
    const data = await this.collectorToday(userId);
    return {
      role: 'COLLECTOR',
      demo: true,
      title: 'Tugas Hari Ini',
      metrics: [
        { label: 'Perhentian', value: String(data.run?.route.stops.length ?? 0) },
        {
          label: 'Selesai',
          value: String(data.run?.route.stops.filter((s) => s.status === 'COLLECTED').length ?? 0),
        },
      ],
      tasks: (data.run?.route.stops ?? []).slice(0, 5).map((stop) => ({
        id: stop.id,
        title: stop.label,
        detail: stop.address,
        status: stop.status,
        href: '/(collector-tabs)/route',
      })),
    };
  }

  private async managerDashboard(userId: string) {
    const membership = await this.membership(userId, ['MANAGER']);
    const orgId = membership.organizationId;
    const [households, invoices, openBatches, inventory, reports] = await Promise.all([
      this.prisma.household.count({ where: { organizationId: orgId, active: true } }),
      this.prisma.invoice.aggregate({
        where: { organizationId: orgId, status: 'UNPAID' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.intakeBatch.count({ where: { organizationId: orgId, status: 'OPEN' } }),
      this.inventoryBalance(orgId),
      this.prisma.wasteReport.count({
        where: { organizationId: orgId, status: { notIn: ['RESOLVED', 'REJECTED'] } },
      }),
    ]);
    return {
      role: membership.role,
      demo: true,
      title: membership.organization.name,
      metrics: [
        { label: 'Pelanggan aktif', value: String(households) },
        { label: 'Tagihan tertunda', value: String(invoices._count) },
        { label: 'Batch terbuka', value: String(openBatches) },
        { label: 'Material tersedia', value: `${inventory.toFixed(1)} kg` },
        { label: 'Laporan aktif', value: String(reports) },
      ],
      tasks: [
        {
          id: 'billing',
          title: 'Pantau penagihan',
          detail: `Rp${(invoices._sum.amount ?? 0).toLocaleString('id-ID')} belum diterima`,
          status: invoices._count ? 'PERLU_TINDAKAN' : 'SELESAI',
        },
        {
          id: 'batch',
          title: 'Selesaikan neraca massa',
          detail: `${openBatches} batch menunggu validasi`,
          status: openBatches ? 'PERLU_TINDAKAN' : 'SELESAI',
        },
      ],
    };
  }

  private async businessDashboard(userId: string) {
    const membership = await this.membership(userId, ['BUSINESS']);
    const [requirements, orders, receipts] = await Promise.all([
      this.prisma.businessRequirement.count({
        where: { organizationId: membership.organizationId, status: 'PUBLISHED' },
      }),
      this.prisma.purchaseOrder.count({
        where: { buyerOrgId: membership.organizationId, status: { in: ['RESERVED', 'CONFIRMED'] } },
      }),
      this.prisma.materialReceipt.aggregate({
        where: { purchaseOrder: { buyerOrgId: membership.organizationId } },
        _sum: { receivedKg: true },
      }),
    ]);
    return {
      role: membership.role,
      demo: true,
      title: membership.organization.name,
      metrics: [
        { label: 'Kebutuhan aktif', value: String(requirements) },
        { label: 'Pesanan berjalan', value: String(orders) },
        {
          label: 'Material diterima',
          value: `${Number(receipts._sum.receivedKg ?? 0).toFixed(1)} kg`,
        },
      ],
      tasks: [
        {
          id: 'catalog',
          title: 'Cari pasokan material',
          detail: 'Bandingkan lot berdasarkan material dan lokasi.',
          status: 'TERSEDIA',
          href: '/(business-tabs)/supply',
        },
      ],
    };
  }

  async householdService(userId: string) {
    const household = await this.prisma.household.findUnique({
      where: { userId },
      include: {
        user: true,
        serviceArea: true,
        subscriptions: { where: { active: true }, include: { servicePlan: true } },
      },
    });
    if (!household) throw new NotFoundException('Profil rumah tangga tidak ditemukan');
    const invoice = await this.prisma.invoice.findFirst({
      where: { householdId: household.id, status: 'UNPAID' },
      orderBy: { dueAt: 'asc' },
    });
    const nextCalendar = await this.prisma.collectionCalendar.findFirst({
      where: { serviceAreaId: household.serviceAreaId, active: true },
    });
    return { household, invoice, nextCalendar };
  }

  async payInvoice(userId: string, invoiceId: string, dto: MockPaymentDto) {
    const existing = await this.prisma.paymentEvent.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) return { ...existing, result: 'duplicate' };
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { household: true, organization: true },
    });
    if (!invoice || invoice.household.userId !== userId)
      throw new NotFoundException('Invoice tidak ditemukan');
    this.assertOrganizationActive(invoice.organization.status);
    if (invoice.status === 'PAID') throw new ConflictException('Invoice sudah dibayar');
    const providerResult = await this.paymentProvider.charge({
      amount: invoice.amount,
      method: dto.method,
      idempotencyKey: dto.idempotencyKey,
    });
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.paymentEvent.create({
        data: {
          invoiceId,
          userId,
          idempotencyKey: dto.idempotencyKey,
          provider: providerResult.provider,
          method: dto.method,
          amount: invoice.amount,
          reference: providerResult.reference,
          status: providerResult.status,
        },
      });
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID', paidAt: payment.occurredAt },
      });
      return { ...payment, result: 'accepted' };
    });
  }

  async collectorToday(userId: string) {
    const collector = await this.prisma.collector.findUnique({
      where: { userId },
      include: { organization: true },
    });
    if (!collector) throw new NotFoundException('Profil Petugas tidak ditemukan');
    this.assertOrganizationActive(collector.organization.status);
    const run = await this.prisma.collectionRun.findFirst({
      where: {
        assignments: { some: { collectorId: collector.id } },
        status: { in: ['PLANNED', 'IN_PROGRESS'] },
      },
      include: {
        route: { include: { stops: { orderBy: { sequence: 'asc' } } } },
        vehicle: true,
        assignments: true,
      },
      orderBy: { scheduledFor: 'asc' },
    });
    return { collector, run };
  }

  async updateStop(userId: string, stopId: string, dto: UpdateStopDto) {
    const allowed = Object.values(RouteStopStatus);
    if (!allowed.includes(dto.status as RouteStopStatus))
      throw new BadRequestException('Status perhentian tidak valid');
    const stop = await this.prisma.routeStop.findUnique({
      where: { id: stopId },
      include: { route: { include: { runs: { include: { assignments: true } } } } },
    });
    if (!stop || !stop.route.runs.some((run) => run.assignments.some((a) => a.userId === userId)))
      throw new NotFoundException('Perhentian tidak ditemukan pada tugas Anda');
    return this.prisma.routeStop.update({
      where: { id: stopId },
      data: { status: dto.status as RouteStopStatus, issueNote: dto.issueNote },
    });
  }

  async cardTap(userId: string, dto: CardTapDto) {
    const duplicate = await this.prisma.cardTapEvent.findUnique({
      where: { deviceEventId: dto.deviceEventId },
    });
    if (duplicate) return { deviceEventId: dto.deviceEventId, result: 'duplicate' };
    const [membership, collectorActor] = await Promise.all([
      this.prisma.organizationMember.findFirst({
        where: { userId, active: true, organization: { type: 'MANAGER' } },
        include: { organization: true },
      }),
      this.prisma.collector.findUnique({ where: { userId }, include: { organization: true } }),
    ]);
    const actorOrganization = membership?.organization ?? collectorActor?.organization;
    if (!actorOrganization) throw new ForbiddenException('Aktor tidak terdaftar pada Pengelola');
    this.assertOrganizationActive(actorOrganization.status);
    const uidHash = createHash('sha256').update(dto.credential.trim().toUpperCase()).digest('hex');
    const card = await this.prisma.collectorCard.findFirst({
      where: {
        active: true,
        OR: [{ cardNumber: dto.credential.trim().toUpperCase() }, { uidHash }],
      },
      include: { collector: true },
    });
    if (!card || card.collector.organizationId !== actorOrganization.id)
      return {
        deviceEventId: dto.deviceEventId,
        result: 'rejected',
        reason: 'Kartu tidak aktif pada organisasi ini',
      };
    if (collectorActor && card.collectorId !== collectorActor.id)
      return {
        deviceEventId: dto.deviceEventId,
        result: 'rejected',
        reason: 'Kartu bukan milik Petugas yang sedang masuk',
      };
    await this.prisma.cardTapEvent.create({
      data: {
        cardId: card.id,
        userId,
        organizationId: actorOrganization.id,
        deviceEventId: dto.deviceEventId,
        source: dto.source,
      },
    });
    return {
      deviceEventId: dto.deviceEventId,
      result: 'accepted',
      collector: { id: card.collector.id, employeeNo: card.collector.employeeNo },
    };
  }

  async managerOperations(userId: string) {
    const membership = await this.membership(userId, ['MANAGER']);
    this.assertOrganizationActive(membership.organization.status);
    const orgId = membership.organizationId;
    const [areas, collectors, runs, batches, lots, orders, reports] = await Promise.all([
      this.prisma.serviceArea.findMany({
        where: { organizationId: orgId },
        include: { _count: { select: { households: true } } },
      }),
      this.prisma.collector.findMany({
        where: { organizationId: orgId },
        include: { user: true, cards: true },
      }),
      this.prisma.collectionRun.findMany({
        where: { organizationId: orgId },
        include: {
          route: true,
          assignments: { include: { collector: { include: { user: true } } } },
        },
        orderBy: { scheduledFor: 'desc' },
        take: 10,
      }),
      this.prisma.intakeBatch.findMany({
        where: { organizationId: orgId },
        include: { weightEvents: true, sortingBatches: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.materialLot.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseOrder.findMany({
        where: { sellerOrgId: orgId },
        include: { buyer: true, lot: true, receipt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.wasteReport.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return {
      organization: membership.organization,
      areas,
      collectors,
      runs,
      batches,
      lots,
      orders,
      reports,
      inventoryKg: await this.inventoryBalance(orgId),
    };
  }

  async createIntakeBatch(userId: string, dto: CreateIntakeBatchDto) {
    const membership = await this.membership(userId, ['MANAGER']);
    this.assertOrganizationActive(membership.organization.status);
    const station = dto.stationId
      ? await this.prisma.weighStation.findFirst({
          where: { id: dto.stationId, organizationId: membership.organizationId },
        })
      : await this.prisma.weighStation.findFirst({
          where: { organizationId: membership.organizationId, active: true },
        });
    if (!station) throw new NotFoundException('Stasiun timbang aktif tidak ditemukan');
    return this.prisma.intakeBatch.create({
      data: {
        organizationId: membership.organizationId,
        stationId: station.id,
        batchNo: dto.batchNo ?? `DEMO-BATCH-${randomUUID().slice(0, 8).toUpperCase()}`,
        toleranceKg: 0.1,
      },
    });
  }

  async createWeightEvent(userId: string, dto: CreateWeightEventDto) {
    const duplicate = await this.prisma.weightEvent.findUnique({
      where: { deviceEventId: dto.deviceEventId },
    });
    if (duplicate)
      return { deviceEventId: dto.deviceEventId, result: 'duplicate', event: duplicate };
    const membership = await this.membership(userId, ['MANAGER']);
    this.assertOrganizationActive(membership.organization.status);
    const batch = await this.prisma.intakeBatch.findUnique({ where: { id: dto.intakeBatchId } });
    if (!batch || batch.organizationId !== membership.organizationId)
      throw new NotFoundException('Batch tidak ditemukan');
    if (batch.status === 'APPROVED')
      throw new ConflictException('Batch yang disahkan bersifat append-only');
    const event = await this.prisma.weightEvent.create({
      data: { ...dto, weightKg: new Prisma.Decimal(dto.weightKg) },
    });
    await this.recalculateBatch(batch.id);
    return { deviceEventId: dto.deviceEventId, result: 'accepted', event };
  }

  private async recalculateBatch(batchId: string) {
    const events = await this.prisma.weightEvent.findMany({ where: { intakeBatchId: batchId } });
    const input = events
      .filter((e) => e.direction === 'IN')
      .reduce((sum, e) => sum + Number(e.weightKg), 0);
    const output = events
      .filter((e) => ['SORTED_OUTPUT', 'RESIDUE'].includes(e.direction))
      .reduce((sum, e) => sum + Number(e.weightKg), 0);
    return this.prisma.intakeBatch.update({
      where: { id: batchId },
      data: {
        inputKg: input,
        outputKg: output,
        status: input > 0 && Math.abs(input - output) <= 1 ? 'BALANCED' : 'OPEN',
      },
    });
  }

  async approveBatch(userId: string, id: string) {
    const membership = await this.membership(userId, ['MANAGER']);
    this.assertOrganizationActive(membership.organization.status);
    const batch = await this.prisma.intakeBatch.findUnique({
      where: { id },
      include: { weightEvents: true },
    });
    if (!batch || batch.organizationId !== membership.organizationId)
      throw new NotFoundException('Batch tidak ditemukan');
    const difference = Math.abs(Number(batch.inputKg) - Number(batch.outputKg));
    if (batch.inputKg.lte(0) || difference > Number(batch.toleranceKg))
      throw new ConflictException(
        `Neraca massa belum seimbang. Selisih ${difference.toFixed(2)} kg.`,
      );
    return this.prisma.$transaction(async (tx) => {
      const grouped = new Map<string, number>();
      for (const event of batch.weightEvents.filter((e) => e.direction === 'SORTED_OUTPUT'))
        grouped.set(event.material, (grouped.get(event.material) ?? 0) + Number(event.weightKg));
      for (const [material, quantityKg] of grouped)
        await tx.materialInventoryLedger.upsert({
          where: {
            referenceType_referenceId_direction: {
              referenceType: `BATCH:${material}`,
              referenceId: id,
              direction: 'CREDIT',
            },
          },
          update: {},
          create: {
            organizationId: batch.organizationId,
            material: material as never,
            direction: 'CREDIT',
            quantityKg,
            referenceType: `BATCH:${material}`,
            referenceId: id,
          },
        });
      return tx.intakeBatch.update({
        where: { id },
        data: { status: 'APPROVED', approvedAt: new Date() },
      });
    });
  }

  async inventoryBalance(orgId: string, material?: string) {
    const entries = await this.prisma.materialInventoryLedger.findMany({
      where: { organizationId: orgId, ...(material ? { material: material as never } : {}) },
    });
    return entries.reduce(
      (total, entry) =>
        total +
        (['CREDIT', 'RELEASE'].includes(entry.direction)
          ? Number(entry.quantityKg)
          : -Number(entry.quantityKg)),
      0,
    );
  }

  async businessCatalog(userId: string) {
    const membership = await this.membership(userId, ['BUSINESS']);
    this.assertOrganizationActive(membership.organization.status);
    const [lots, requirements, orders] = await Promise.all([
      this.prisma.materialLot.findMany({
        where: { status: 'PUBLISHED', organization: { status: 'ACTIVE' } },
        include: { organization: true, qualitySpec: true },
      }),
      this.prisma.businessRequirement.findMany({
        where: { organizationId: membership.organizationId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseOrder.findMany({
        where: { buyerOrgId: membership.organizationId },
        include: { seller: true, lot: true, receipt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { lots, requirements, orders };
  }

  async createRequirement(userId: string, dto: CreateRequirementDto) {
    const membership = await this.membership(userId, ['BUSINESS']);
    this.assertOrganizationActive(membership.organization.status);
    return this.prisma.businessRequirement.create({
      data: { organizationId: membership.organizationId, ...dto, status: 'PUBLISHED' },
    });
  }

  async createLot(userId: string, dto: CreateLotDto) {
    const membership = await this.membership(userId, ['MANAGER']);
    this.assertOrganizationActive(membership.organization.status);
    const available = await this.inventoryBalance(membership.organizationId, dto.material);
    if (available < dto.quantityKg)
      throw new ConflictException(`Inventory tersedia hanya ${available.toFixed(2)} kg`);
    return this.prisma.materialLot.create({
      data: {
        organizationId: membership.organizationId,
        code: `DEMO-LOT-${randomUUID().slice(0, 8).toUpperCase()}`,
        material: dto.material,
        quantityKg: dto.quantityKg,
        availableKg: dto.quantityKg,
        pricePerKg: dto.pricePerKg,
        status: 'PUBLISHED',
      },
    });
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const membership = await this.membership(userId, ['BUSINESS']);
    this.assertOrganizationActive(membership.organization.status);
    return this.prisma.$transaction(
      async (tx) => {
        const lot = await tx.materialLot.findUnique({
          where: { id: dto.lotId },
          include: { organization: true },
        });
        if (
          !lot ||
          lot.status !== PublicationStatus.PUBLISHED ||
          lot.organization.status !== 'ACTIVE'
        )
          throw new NotFoundException('Lot tidak tersedia');
        const updated = await tx.materialLot.updateMany({
          where: { id: lot.id, availableKg: { gte: dto.quantityKg } },
          data: { availableKg: { decrement: dto.quantityKg } },
        });
        if (updated.count !== 1) throw new ConflictException('Kuantitas lot tidak mencukupi');
        const order = await tx.purchaseOrder.create({
          data: {
            sellerOrgId: lot.organizationId,
            buyerOrgId: membership.organizationId,
            lotId: lot.id,
            orderNo: `DEMO-PO-${randomUUID().slice(0, 8).toUpperCase()}`,
            quantityKg: dto.quantityKg,
            pricePerKg: lot.pricePerKg,
            totalAmount: Math.round(dto.quantityKg * lot.pricePerKg),
            status: 'RESERVED',
          },
        });
        await tx.materialInventoryLedger.create({
          data: {
            organizationId: lot.organizationId,
            material: lot.material,
            direction: 'RESERVE',
            quantityKg: dto.quantityKg,
            referenceType: 'PURCHASE_ORDER',
            referenceId: order.id,
          },
        });
        return order;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async receiveOrder(userId: string, orderId: string, dto: ReceiveOrderDto) {
    const membership = await this.membership(userId, ['BUSINESS']);
    this.assertOrganizationActive(membership.organization.status);
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { lot: true, receipt: true },
    });
    if (!order || order.buyerOrgId !== membership.organizationId)
      throw new NotFoundException('Pesanan tidak ditemukan');
    if (order.receipt) throw new ConflictException('Penerimaan sudah dikonfirmasi');
    if (dto.receivedKg > Number(order.quantityKg))
      throw new BadRequestException('Berat diterima melebihi jumlah pesanan');
    return this.prisma.$transaction(async (tx) => {
      const receipt = await tx.materialReceipt.create({
        data: {
          purchaseOrderId: order.id,
          receivedKg: dto.receivedKg,
          residueKg: dto.residueKg ?? 0,
          note: dto.note,
        },
      });
      await tx.purchaseOrder.update({ where: { id: order.id }, data: { status: 'RECEIVED' } });
      await tx.materialInventoryLedger.create({
        data: {
          organizationId: order.sellerOrgId,
          material: order.lot.material,
          direction: 'DEBIT',
          quantityKg: dto.receivedKg,
          referenceType: 'MATERIAL_RECEIPT',
          referenceId: receipt.id,
        },
      });
      await tx.orderSettlement.create({
        data: {
          purchaseOrderId: order.id,
          amount: Math.round(dto.receivedKg * order.pricePerKg),
          reference: `DEMO-SET-${randomUUID().slice(0, 8).toUpperCase()}`,
        },
      });
      return receipt;
    });
  }

  async myReports(userId: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId, active: true },
    });
    return this.prisma.wasteReport.findMany({
      where:
        membership?.role === 'HOUSEHOLD'
          ? { reporterId: userId }
          : { organizationId: membership?.organizationId },
      include: { events: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReport(userId: string, dto: CreateWasteReportDto) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId, role: 'HOUSEHOLD', active: true },
      include: { organization: true },
    });
    if (!membership) throw new ForbiddenException('Keanggotaan rumah tangga tidak ditemukan');
    this.assertOrganizationActive(membership.organization.status);
    return this.prisma.$transaction(async (tx) => {
      const report = await tx.wasteReport.create({
        data: {
          organizationId: membership.organizationId,
          reporterId: userId,
          status: 'SUBMITTED',
          ...dto,
        },
      });
      await tx.wasteReportEvent.create({
        data: {
          reportId: report.id,
          actorId: userId,
          status: 'SUBMITTED',
          note: 'Laporan dibuat warga',
        },
      });
      return report;
    });
  }

  async resolveReport(userId: string, id: string, note: string) {
    const membership = await this.membership(userId, ['MANAGER']);
    this.assertOrganizationActive(membership.organization.status);
    const report = await this.prisma.wasteReport.findUnique({ where: { id } });
    if (!report || report.organizationId !== membership.organizationId)
      throw new NotFoundException('Laporan tidak ditemukan');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.wasteReport.update({
        where: { id },
        data: { status: 'RESOLVED', resolutionNote: note, resolvedAt: new Date() },
      });
      await tx.wasteReportEvent.create({
        data: { reportId: id, actorId: userId, status: 'RESOLVED', note },
      });
      return updated;
    });
  }
}
