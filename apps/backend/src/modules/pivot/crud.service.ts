import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MaterialType, Prisma, SupportTicketStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { normalizePhoneID } from '@bingo/shared-utils';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import { PrismaService } from '../../prisma/prisma.service';
import { CrudListQueryDto } from './dto/crud.dto';
import type {
  ArchiveResourceDto,
  MaterialCategoryDto,
  SupportTicketActionDto,
} from './dto/crud.dto';

const MANAGER_RESOURCES = [
  'service-areas',
  'households',
  'service-plans',
  'calendars',
  'routes',
  'vehicles',
  'collectors',
  'weigh-stations',
  'facilities',
  'lots',
] as const;
type ManagerResource = (typeof MANAGER_RESOURCES)[number];

@Injectable()
export class PivotCrudService {
  constructor(private readonly prisma: PrismaService) {}

  private async membership(userId: string, type: 'MANAGER' | 'BUSINESS') {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId, active: true, organization: { type } },
      include: { organization: true },
    });
    if (!membership) throw new ForbiddenException('Keanggotaan organisasi tidak ditemukan');
    if (membership.organization.status !== 'ACTIVE')
      throw new ForbiddenException('Organisasi belum aktif atau sedang disuspend');
    return membership;
  }

  private assertManagerResource(value: string): asserts value is ManagerResource {
    if (!MANAGER_RESOURCES.includes(value as ManagerResource))
      throw new NotFoundException('Resource manajemen tidak ditemukan');
  }

  private async assertServiceArea(organizationId: string, serviceAreaId: string) {
    const area = await this.prisma.serviceArea.findFirst({
      where: { id: serviceAreaId, organizationId, archivedAt: null },
    });
    if (!area) throw new NotFoundException('Wilayah layanan tidak ditemukan');
    return area;
  }

  private page<T>(items: T[], total: number, query: CrudListQueryDto) {
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  private paging(query: CrudListQueryDto) {
    return { skip: (query.page - 1) * query.pageSize, take: query.pageSize };
  }

  private async audit(
    actorId: string,
    organizationId: string | null,
    action: string,
    resourceType: string,
    resourceId: string,
    reason?: string,
  ) {
    await this.prisma.auditEvent.create({
      data: { actorId, organizationId, action, resourceType, resourceId, reason },
    });
  }

  async listManager(userId: string, resource: string, query: CrudListQueryDto) {
    this.assertManagerResource(resource);
    const membership = await this.membership(userId, 'MANAGER');
    const organizationId = membership.organizationId;
    const archivedAt = query.archived ? { not: null } : null;
    const paging = this.paging(query);
    const orderBy = { createdAt: query.sort } as const;
    const search = query.search?.trim();

    switch (resource) {
      case 'service-areas': {
        const where: Prisma.ServiceAreaWhereInput = {
          organizationId,
          archivedAt,
          ...(query.status ? { status: query.status as never } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { region: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        };
        const [items, total] = await this.prisma.$transaction([
          this.prisma.serviceArea.findMany({
            where,
            ...paging,
            orderBy,
            include: { _count: { select: { households: true, routes: true } } },
          }),
          this.prisma.serviceArea.count({ where }),
        ]);
        return this.page(items, total, query);
      }
      case 'households': {
        const where: Prisma.HouseholdWhereInput = {
          organizationId,
          archivedAt,
          ...(search
            ? {
                OR: [
                  { accountNo: { contains: search, mode: 'insensitive' } },
                  { displayAddress: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        };
        const [items, total] = await this.prisma.$transaction([
          this.prisma.household.findMany({
            where,
            ...paging,
            orderBy,
            include: {
              serviceArea: true,
              user: { select: { id: true, name: true, phone: true } },
              subscriptions: { where: { active: true }, include: { servicePlan: true } },
            },
          }),
          this.prisma.household.count({ where }),
        ]);
        return this.page(items, total, query);
      }
      case 'service-plans': {
        const where: Prisma.ServicePlanWhereInput = {
          organizationId,
          archivedAt,
          ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
        };
        const [items, total] = await this.prisma.$transaction([
          this.prisma.servicePlan.findMany({
            where,
            ...paging,
            orderBy,
            include: { serviceArea: true, _count: { select: { subscriptions: true } } },
          }),
          this.prisma.servicePlan.count({ where }),
        ]);
        return this.page(items, total, query);
      }
      case 'calendars': {
        const where: Prisma.CollectionCalendarWhereInput = {
          organizationId,
          archivedAt,
          ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
        };
        const [items, total] = await this.prisma.$transaction([
          this.prisma.collectionCalendar.findMany({
            where,
            ...paging,
            orderBy: { title: query.sort },
            include: { serviceArea: true },
          }),
          this.prisma.collectionCalendar.count({ where }),
        ]);
        return this.page(items, total, query);
      }
      case 'routes': {
        const where: Prisma.CollectionRouteWhereInput = {
          organizationId,
          archivedAt,
          ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
        };
        const [items, total] = await this.prisma.$transaction([
          this.prisma.collectionRoute.findMany({
            where,
            ...paging,
            orderBy,
            include: {
              serviceArea: true,
              stops: { orderBy: { sequence: 'asc' } },
              _count: { select: { runs: true } },
            },
          }),
          this.prisma.collectionRoute.count({ where }),
        ]);
        return this.page(items, total, query);
      }
      case 'vehicles': {
        const where: Prisma.CollectionVehicleWhereInput = {
          organizationId,
          archivedAt,
          ...(search
            ? {
                OR: [
                  { label: { contains: search, mode: 'insensitive' } },
                  { plateNumber: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        };
        const [items, total] = await this.prisma.$transaction([
          this.prisma.collectionVehicle.findMany({
            where,
            ...paging,
            orderBy: { label: query.sort },
            include: { _count: { select: { runs: true } } },
          }),
          this.prisma.collectionVehicle.count({ where }),
        ]);
        return this.page(items, total, query);
      }
      case 'collectors': {
        const where: Prisma.CollectorWhereInput = {
          organizationId,
          archivedAt,
          ...(search
            ? {
                OR: [
                  { employeeNo: { contains: search, mode: 'insensitive' } },
                  { user: { name: { contains: search, mode: 'insensitive' } } },
                ],
              }
            : {}),
        };
        const [items, total] = await this.prisma.$transaction([
          this.prisma.collector.findMany({
            where,
            ...paging,
            orderBy: { hiredAt: query.sort },
            include: {
              user: { select: { id: true, name: true, phone: true, active: true } },
              cards: true,
              _count: { select: { assignments: true } },
            },
          }),
          this.prisma.collector.count({ where }),
        ]);
        return this.page(items, total, query);
      }
      case 'weigh-stations': {
        const where: Prisma.WeighStationWhereInput = {
          organizationId,
          archivedAt,
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { address: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        };
        const [items, total] = await this.prisma.$transaction([
          this.prisma.weighStation.findMany({
            where,
            ...paging,
            orderBy: { name: query.sort },
            include: { channels: true, _count: { select: { intakeBatches: true } } },
          }),
          this.prisma.weighStation.count({ where }),
        ]);
        return this.page(items, total, query);
      }
      case 'facilities': {
        const where: Prisma.FacilityWhereInput = {
          organizationId,
          archivedAt,
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { address: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        };
        const [items, total] = await this.prisma.$transaction([
          this.prisma.facility.findMany({
            where,
            ...paging,
            orderBy,
            include: {
              materialRules: true,
              verifications: { orderBy: { verifiedAt: 'desc' }, take: 1 },
            },
          }),
          this.prisma.facility.count({ where }),
        ]);
        return this.page(items, total, query);
      }
      case 'lots': {
        const where: Prisma.MaterialLotWhereInput = {
          organizationId,
          archivedAt,
          ...(query.status ? { status: query.status as never } : {}),
          ...(search ? { code: { contains: search, mode: 'insensitive' } } : {}),
        };
        const [items, total] = await this.prisma.$transaction([
          this.prisma.materialLot.findMany({
            where,
            ...paging,
            orderBy,
            include: { _count: { select: { orders: true } } },
          }),
          this.prisma.materialLot.count({ where }),
        ]);
        return this.page(items, total, query);
      }
    }
  }

  async getManager(userId: string, resource: string, id: string) {
    const query = Object.assign(new CrudListQueryDto(), { pageSize: 100 });
    const active = await this.listManager(userId, resource, query);
    let item = active.items.find((candidate: { id: string }) => candidate.id === id);
    if (!item) {
      query.archived = true;
      const archived = await this.listManager(userId, resource, query);
      item = archived.items.find((candidate: { id: string }) => candidate.id === id);
    }
    if (!item) throw new NotFoundException('Resource tidak ditemukan');
    return item;
  }

  async createManager(user: AuthenticatedUser, resource: string, data: Record<string, unknown>) {
    this.assertManagerResource(resource);
    const membership = await this.membership(user.id, 'MANAGER');
    const organizationId = membership.organizationId;
    let created: { id: string };
    switch (resource) {
      case 'service-areas':
        created = await this.prisma.serviceArea.create({
          data: {
            organizationId,
            name: String(data.name),
            region: String(data.region),
            status: (data.status as never) ?? 'ACTIVE',
            densityLabel: data.densityLabel ? String(data.densityLabel) : undefined,
          },
        });
        break;
      case 'households':
        await this.assertServiceArea(organizationId, String(data.serviceAreaId));
        const householdUser = data.userPhone
          ? await this.findUnlinkedHouseholdUser(String(data.userPhone))
          : null;
        created = await this.prisma.household.create({
          data: {
            organizationId,
            serviceAreaId: String(data.serviceAreaId),
            accountNo: String(data.accountNo),
            displayAddress: String(data.displayAddress),
            lat: data.lat == null ? undefined : Number(data.lat),
            lng: data.lng == null ? undefined : Number(data.lng),
            userId: householdUser?.id,
          },
        });
        break;
      case 'service-plans':
        if (data.serviceAreaId)
          await this.assertServiceArea(organizationId, String(data.serviceAreaId));
        created = await this.prisma.servicePlan.create({
          data: {
            organizationId,
            serviceAreaId: data.serviceAreaId ? String(data.serviceAreaId) : undefined,
            name: String(data.name),
            monthlyFee: Number(data.monthlyFee),
            collectionDays: (data.collectionDays as never[]) ?? [],
          },
        });
        break;
      case 'calendars':
        await this.assertServiceArea(organizationId, String(data.serviceAreaId));
        created = await this.prisma.collectionCalendar.create({
          data: {
            organizationId,
            serviceAreaId: String(data.serviceAreaId),
            title: String(data.title),
            days: (data.days as never[]) ?? [],
            startTime: data.startTime ? String(data.startTime) : undefined,
            endTime: data.endTime ? String(data.endTime) : undefined,
            materials: (data.materials as never[]) ?? [],
          },
        });
        break;
      case 'routes': {
        await this.assertServiceArea(organizationId, String(data.serviceAreaId));
        const stops = Array.isArray(data.stops) ? data.stops.map(String) : [];
        created = await this.prisma.collectionRoute.create({
          data: {
            organizationId,
            serviceAreaId: String(data.serviceAreaId),
            name: String(data.name),
            stops: {
              create: stops.map((address, index) => ({
                sequence: index + 1,
                label: `Titik ${index + 1}`,
                address,
              })),
            },
          },
        });
        break;
      }
      case 'vehicles':
        created = await this.prisma.collectionVehicle.create({
          data: {
            organizationId,
            label: String(data.label),
            plateNumber: data.plateNumber ? String(data.plateNumber) : undefined,
            capacityKg: data.capacityKg == null ? undefined : Number(data.capacityKg),
          },
        });
        break;
      case 'collectors': {
        if (membership.role !== 'MANAGER_ADMIN')
          throw new ForbiddenException('Hanya Admin Pengelola yang dapat membuat Petugas');
        const phone = normalizePhoneID(String(data.phone));
        if (!phone) throw new BadRequestException('Nomor telepon tidak valid');
        const passwordHash = await bcrypt.hash(String(data.initialPassword), 12);
        created = await this.prisma.$transaction(async (tx) => {
          const account = await tx.user.create({
            data: { name: String(data.name), phone, role: 'COLLECTOR', passwordHash },
          });
          await tx.organizationMember.create({
            data: { organizationId, userId: account.id, role: 'COLLECTOR' },
          });
          return tx.collector.create({
            data: {
              organizationId,
              userId: account.id,
              employeeNo: String(data.employeeNo).toUpperCase(),
              hiredAt: new Date(),
            },
          });
        });
        break;
      }
      case 'weigh-stations':
        created = await this.prisma.weighStation.create({
          data: {
            organizationId,
            name: String(data.name),
            address: String(data.address),
            channels: {
              create: Array.isArray(data.channels)
                ? data.channels.map((label) => ({
                    label: String(label),
                    source: 'MANUAL' as const,
                  }))
                : [],
            },
          },
        });
        break;
      case 'facilities':
        created = await this.prisma.facility.create({
          data: {
            organizationId,
            name: String(data.name),
            operatorName: String(data.operatorName),
            address: String(data.address),
            lat: Number(data.lat),
            lng: Number(data.lng),
            status: 'ACTIVE',
            sourceUrl: String(data.sourceUrl),
            openingNote: data.openingNote ? String(data.openingNote) : undefined,
            verifiedAt: new Date(),
            materialRules: {
              create: ((data.materials as string[]) ?? []).map((material) => ({
                material: material as MaterialType,
              })),
            },
          },
        });
        break;
      case 'lots':
        created = await this.prisma.materialLot.create({
          data: {
            organizationId,
            code: `LOT-${Date.now()}`,
            material: data.material as MaterialType,
            quantityKg: Number(data.quantityKg),
            availableKg: Number(data.quantityKg),
            pricePerKg: Number(data.pricePerKg),
            status: 'DRAFT',
          },
        });
        break;
    }
    await this.audit(
      user.id,
      organizationId,
      `${resource.toUpperCase().replaceAll('-', '_')}_CREATED`,
      resource,
      created.id,
    );
    return created;
  }

  async updateManager(
    user: AuthenticatedUser,
    resource: string,
    id: string,
    data: Record<string, unknown>,
  ) {
    this.assertManagerResource(resource);
    const membership = await this.membership(user.id, 'MANAGER');
    await this.getManager(user.id, resource, id);
    let result: { id: string };
    switch (resource) {
      case 'service-areas':
        result = await this.prisma.serviceArea.update({
          where: { id },
          data: {
            name: data.name ? String(data.name) : undefined,
            region: data.region ? String(data.region) : undefined,
            densityLabel: data.densityLabel == null ? undefined : String(data.densityLabel),
            status: data.status as never,
          },
        });
        break;
      case 'households': {
        if (data.serviceAreaId)
          await this.assertServiceArea(membership.organizationId, String(data.serviceAreaId));
        result = await this.prisma.household.update({
          where: { id },
          data: {
            serviceAreaId: data.serviceAreaId ? String(data.serviceAreaId) : undefined,
            accountNo: data.accountNo ? String(data.accountNo) : undefined,
            displayAddress: data.displayAddress ? String(data.displayAddress) : undefined,
            lat: data.lat == null ? undefined : Number(data.lat),
            lng: data.lng == null ? undefined : Number(data.lng),
            ...(data.userPhone === ''
              ? { userId: null }
              : data.userPhone
                ? { userId: (await this.findUnlinkedHouseholdUser(String(data.userPhone), id)).id }
                : {}),
          },
        });
        break;
      }
      case 'service-plans': {
        if (data.serviceAreaId)
          await this.assertServiceArea(membership.organizationId, String(data.serviceAreaId));
        result = await this.prisma.servicePlan.update({
          where: { id },
          data: {
            serviceAreaId: data.serviceAreaId ? String(data.serviceAreaId) : undefined,
            name: data.name ? String(data.name) : undefined,
            monthlyFee: data.monthlyFee == null ? undefined : Number(data.monthlyFee),
            collectionDays: Array.isArray(data.collectionDays)
              ? (data.collectionDays as never[])
              : undefined,
          },
        });
        break;
      }
      case 'calendars': {
        if (data.serviceAreaId)
          await this.assertServiceArea(membership.organizationId, String(data.serviceAreaId));
        result = await this.prisma.collectionCalendar.update({
          where: { id },
          data: {
            serviceAreaId: data.serviceAreaId ? String(data.serviceAreaId) : undefined,
            title: data.title ? String(data.title) : undefined,
            days: Array.isArray(data.days) ? (data.days as never[]) : undefined,
            startTime: data.startTime == null ? undefined : String(data.startTime),
            endTime: data.endTime == null ? undefined : String(data.endTime),
            materials: Array.isArray(data.materials) ? (data.materials as never[]) : undefined,
          },
        });
        break;
      }
      case 'vehicles':
        result = await this.prisma.collectionVehicle.update({
          where: { id },
          data: {
            label: data.label ? String(data.label) : undefined,
            plateNumber: data.plateNumber == null ? undefined : String(data.plateNumber),
            capacityKg: data.capacityKg == null ? undefined : Number(data.capacityKg),
          },
        });
        break;
      case 'collectors': {
        if (membership.role !== 'MANAGER_ADMIN')
          throw new ForbiddenException('Hanya Admin Pengelola yang dapat mengubah Petugas');
        const collector = await this.prisma.collector.update({
          where: { id },
          data: data.employeeNo ? { employeeNo: String(data.employeeNo).toUpperCase() } : {},
        });
        if (data.name || data.phone)
          await this.prisma.user.update({
            where: { id: collector.userId },
            data: {
              ...(data.name ? { name: String(data.name) } : {}),
              ...(data.phone ? { phone: normalizePhoneID(String(data.phone)) } : {}),
            },
          });
        result = collector;
        break;
      }
      case 'weigh-stations':
        result = await this.prisma.$transaction(async (tx) => {
          if (Array.isArray(data.channels)) {
            const labels = [
              ...new Set(data.channels.map((value) => String(value).trim()).filter(Boolean)),
            ];
            const existing = await tx.scaleChannel.findMany({ where: { stationId: id } });
            await Promise.all(
              existing.map((channel) =>
                tx.scaleChannel.update({
                  where: { id: channel.id },
                  data: { active: labels.includes(channel.label) },
                }),
              ),
            );
            const existingLabels = new Set(existing.map((channel) => channel.label));
            await tx.scaleChannel.createMany({
              data: labels
                .filter((label) => !existingLabels.has(label))
                .map((label) => ({ stationId: id, label, source: 'MANUAL' as const })),
            });
          }
          return tx.weighStation.update({
            where: { id },
            data: {
              name: data.name ? String(data.name) : undefined,
              address: data.address ? String(data.address) : undefined,
            },
          });
        });
        break;
      case 'facilities':
        result = await this.prisma.facility.update({
          where: { id },
          data: {
            name: data.name ? String(data.name) : undefined,
            operatorName: data.operatorName ? String(data.operatorName) : undefined,
            address: data.address ? String(data.address) : undefined,
            lat: data.lat == null ? undefined : Number(data.lat),
            lng: data.lng == null ? undefined : Number(data.lng),
            sourceUrl: data.sourceUrl ? String(data.sourceUrl) : undefined,
            openingNote: data.openingNote == null ? undefined : String(data.openingNote),
          },
        });
        break;
      case 'lots': {
        const lot = await this.prisma.materialLot.findFirst({
          where: { id, organizationId: membership.organizationId },
        });
        if (!lot || lot.status !== 'DRAFT')
          throw new ConflictException('Hanya lot DRAFT yang dapat diedit');
        result = await this.prisma.materialLot.update({
          where: { id },
          data: {
            material: data.material as MaterialType | undefined,
            quantityKg: data.quantityKg == null ? undefined : Number(data.quantityKg),
            availableKg: data.quantityKg == null ? undefined : Number(data.quantityKg),
            pricePerKg: data.pricePerKg == null ? undefined : Number(data.pricePerKg),
          },
        });
        break;
      }
      case 'routes': {
        const route = await this.prisma.collectionRoute.findUnique({
          where: { id },
          include: { _count: { select: { runs: true } } },
        });
        if (route?._count.runs)
          throw new ConflictException('Rute bersejarah harus direvisi melalui aksi duplikasi');
        if (data.serviceAreaId)
          await this.assertServiceArea(membership.organizationId, String(data.serviceAreaId));
        result = await this.prisma.$transaction(async (tx) => {
          if (Array.isArray(data.stops)) {
            await tx.routeStop.deleteMany({ where: { routeId: id } });
          }
          return tx.collectionRoute.update({
            where: { id },
            data: {
              name: data.name ? String(data.name) : undefined,
              serviceAreaId: data.serviceAreaId ? String(data.serviceAreaId) : undefined,
              ...(Array.isArray(data.stops)
                ? {
                    stops: {
                      create: data.stops.map((address, index) => ({
                        sequence: index + 1,
                        label: `Titik ${index + 1}`,
                        address: String(address),
                      })),
                    },
                  }
                : {}),
            },
          });
        });
        break;
      }
    }
    await this.audit(
      user.id,
      membership.organizationId,
      `${resource.toUpperCase().replaceAll('-', '_')}_UPDATED`,
      resource,
      id,
    );
    return result;
  }

  async archiveManager(
    user: AuthenticatedUser,
    resource: string,
    id: string,
    dto: ArchiveResourceDto,
    restore = false,
  ) {
    this.assertManagerResource(resource);
    const membership = await this.membership(user.id, 'MANAGER');
    await this.getManager(user.id, resource, id);
    const archive = restore
      ? { archivedAt: null, archivedBy: null, archiveReason: null }
      : { archivedAt: new Date(), archivedBy: user.id, archiveReason: dto.reason };
    const active = restore;
    switch (resource) {
      case 'service-areas':
        await this.prisma.serviceArea.update({
          where: { id },
          data: { ...archive, status: restore ? 'ACTIVE' : 'INACTIVE' },
        });
        break;
      case 'households':
        await this.prisma.household.update({ where: { id }, data: { ...archive, active } });
        break;
      case 'service-plans':
        await this.prisma.servicePlan.update({ where: { id }, data: { ...archive, active } });
        break;
      case 'calendars':
        await this.prisma.collectionCalendar.update({
          where: { id },
          data: { ...archive, active },
        });
        break;
      case 'routes':
        await this.prisma.collectionRoute.update({ where: { id }, data: { ...archive, active } });
        break;
      case 'vehicles':
        await this.prisma.collectionVehicle.update({ where: { id }, data: { ...archive, active } });
        break;
      case 'collectors': {
        const collector = await this.prisma.collector.update({
          where: { id },
          data: { ...archive, active },
        });
        await this.prisma.user.update({ where: { id: collector.userId }, data: { active } });
        break;
      }
      case 'weigh-stations':
        await this.prisma.weighStation.update({ where: { id }, data: { ...archive, active } });
        break;
      case 'facilities':
        await this.prisma.facility.update({
          where: { id },
          data: { ...archive, status: restore ? 'ACTIVE' : 'INACTIVE' },
        });
        break;
      case 'lots':
        if (!restore) {
          const lot = await this.prisma.materialLot.findUnique({ where: { id } });
          if (lot?.status === 'PUBLISHED')
            throw new ConflictException('Tutup lot terlebih dahulu sebelum mengarsipkannya');
        }
        await this.prisma.materialLot.update({
          where: { id },
          data: { ...archive, status: restore ? 'DRAFT' : 'CLOSED' },
        });
        break;
    }
    await this.audit(
      user.id,
      membership.organizationId,
      restore ? 'RESOURCE_RESTORED' : 'RESOURCE_ARCHIVED',
      resource,
      id,
      dto.reason,
    );
    return { id, archived: !restore };
  }

  async managerAction(
    user: AuthenticatedUser,
    resource: string,
    id: string,
    action: string,
    reason?: string,
  ) {
    this.assertManagerResource(resource);
    const membership = await this.membership(user.id, 'MANAGER');
    await this.getManager(user.id, resource, id);
    if (resource === 'lots') {
      const lot = await this.prisma.materialLot.findFirst({
        where: { id, organizationId: membership.organizationId },
      });
      if (!lot) throw new NotFoundException('Lot tidak ditemukan');
      if (action === 'publish' && lot.status !== 'DRAFT')
        throw new ConflictException('Hanya lot DRAFT yang dapat diterbitkan');
      if (action === 'close' && !['DRAFT', 'PUBLISHED'].includes(lot.status))
        throw new ConflictException('Lot tidak dapat ditutup pada status ini');
      const status = action === 'publish' ? 'PUBLISHED' : action === 'close' ? 'CLOSED' : null;
      if (!status) throw new BadRequestException('Aksi lot tidak valid');
      await this.prisma.$transaction(
        async (tx) => {
          if (action === 'publish') {
            const entries = await tx.materialInventoryLedger.findMany({
              where: { organizationId: membership.organizationId, material: lot.material },
            });
            const available = entries.reduce(
              (total, entry) =>
                total +
                (['CREDIT', 'RELEASE'].includes(entry.direction)
                  ? Number(entry.quantityKg)
                  : -Number(entry.quantityKg)),
              0,
            );
            if (available < Number(lot.quantityKg))
              throw new ConflictException(`Inventory tersedia hanya ${available.toFixed(2)} kg`);
            await tx.materialInventoryLedger.create({
              data: {
                organizationId: membership.organizationId,
                material: lot.material,
                direction: 'RESERVE',
                quantityKg: lot.quantityKg,
                referenceType: 'MATERIAL_LOT',
                referenceId: lot.id,
              },
            });
          } else if (lot.status === 'PUBLISHED' && Number(lot.availableKg) > 0) {
            await tx.materialInventoryLedger.create({
              data: {
                organizationId: membership.organizationId,
                material: lot.material,
                direction: 'RELEASE',
                quantityKg: lot.availableKg,
                referenceType: 'MATERIAL_LOT_CLOSE',
                referenceId: lot.id,
              },
            });
          }
          await tx.materialLot.update({
            where: { id },
            data: { status, ...(action === 'close' ? { availableKg: 0 } : {}) },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } else if (resource === 'routes' && action === 'duplicate') {
      const route = await this.prisma.collectionRoute.findFirst({
        where: { id, organizationId: membership.organizationId },
        include: { stops: { orderBy: { sequence: 'asc' } } },
      });
      if (!route) throw new NotFoundException('Rute tidak ditemukan');
      const duplicate = await this.prisma.collectionRoute.create({
        data: {
          organizationId: route.organizationId,
          serviceAreaId: route.serviceAreaId,
          name: `${route.name} (Revisi)`,
          stops: {
            create: route.stops.map((stop) => ({
              sequence: stop.sequence,
              label: stop.label,
              address: stop.address,
              householdId: stop.householdId,
            })),
          },
        },
      });
      await this.audit(
        user.id,
        membership.organizationId,
        'ROUTE_DUPLICATED',
        resource,
        duplicate.id,
        reason,
      );
      return duplicate;
    } else if (resource === 'facilities' && action === 'request-verification') {
      await this.prisma.facility.update({
        where: { id },
        data: { verificationRequestedAt: new Date(), verificationRequestedBy: user.id },
      });
    } else throw new BadRequestException('Aksi resource tidak valid');
    await this.audit(
      user.id,
      membership.organizationId,
      `${resource.toUpperCase()}_${action.toUpperCase()}`,
      resource,
      id,
      reason,
    );
    return { id, action };
  }

  async deleteManagerDraft(user: AuthenticatedUser, resource: string, id: string) {
    this.assertManagerResource(resource);
    const membership = await this.membership(user.id, 'MANAGER');
    await this.getManager(user.id, resource, id);
    if (resource === 'lots') {
      const lot = await this.prisma.materialLot.findUnique({
        where: { id },
        include: { _count: { select: { orders: true } } },
      });
      if (!lot || lot.status !== 'DRAFT' || lot._count.orders)
        throw new ConflictException('Hanya lot DRAFT tanpa pesanan yang dapat dihapus');
      await this.prisma.materialLot.delete({ where: { id } });
    } else if (resource === 'routes') {
      const route = await this.prisma.collectionRoute.findUnique({
        where: { id },
        include: { _count: { select: { runs: true } } },
      });
      if (!route || route._count.runs)
        throw new ConflictException('Rute dengan riwayat tugas tidak dapat dihapus');
      await this.prisma.collectionRoute.delete({ where: { id } });
    } else throw new ConflictException('Resource ini harus diarsipkan, bukan dihapus');
    await this.audit(user.id, membership.organizationId, 'DRAFT_DELETED', resource, id);
    return { id, deleted: true };
  }

  private async findUnlinkedHouseholdUser(phoneInput: string, currentHouseholdId?: string) {
    const phone = normalizePhoneID(phoneInput);
    if (!phone) throw new BadRequestException('Nomor telepon akun Warga tidak valid');
    const account = await this.prisma.user.findUnique({
      where: { phone },
      include: { householdProfile: true },
    });
    if (!account || account.role !== 'HOUSEHOLD')
      throw new NotFoundException('Akun Warga dengan nomor tersebut tidak ditemukan');
    if (account.householdProfile && account.householdProfile.id !== currentHouseholdId)
      throw new ConflictException('Akun Warga sudah terhubung ke rumah tangga lain');
    return account;
  }

  async listRequirements(userId: string, query: CrudListQueryDto) {
    const membership = await this.membership(userId, 'BUSINESS');
    const where: Prisma.BusinessRequirementWhereInput = {
      organizationId: membership.organizationId,
      archivedAt: query.archived ? { not: null } : null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.businessRequirement.findMany({
        where,
        ...this.paging(query),
        orderBy: { createdAt: query.sort },
        include: { qualitySpecs: true },
      }),
      this.prisma.businessRequirement.count({ where }),
    ]);
    return this.page(items, total, query);
  }

  async updateRequirement(user: AuthenticatedUser, id: string, data: Record<string, unknown>) {
    const membership = await this.membership(user.id, 'BUSINESS');
    const requirement = await this.prisma.businessRequirement.findFirst({
      where: { id, organizationId: membership.organizationId },
    });
    if (!requirement) throw new NotFoundException('Kebutuhan material tidak ditemukan');
    if (requirement.status !== 'DRAFT')
      throw new ConflictException('Hanya kebutuhan DRAFT yang dapat diedit');
    const result = await this.prisma.businessRequirement.update({
      where: { id },
      data: {
        title: data.title ? String(data.title) : undefined,
        material: data.material as MaterialType | undefined,
        quantityKg: data.quantityKg == null ? undefined : Number(data.quantityKg),
        pricePerKg: data.pricePerKg == null ? undefined : Number(data.pricePerKg),
        region: data.region ? String(data.region) : undefined,
      },
    });
    if (data.qualitySpec && typeof data.qualitySpec === 'object') {
      const spec = data.qualitySpec as Record<string, unknown>;
      await this.prisma.materialQualitySpec.deleteMany({ where: { requirementId: id } });
      await this.prisma.materialQualitySpec.create({
        data: {
          organizationId: membership.organizationId,
          requirementId: id,
          material: result.material,
          moistureMaxPct: spec.moistureMaxPct == null ? undefined : Number(spec.moistureMaxPct),
          contaminationMaxPct:
            spec.contaminationMaxPct == null ? undefined : Number(spec.contaminationMaxPct),
          notes: spec.notes ? String(spec.notes) : undefined,
        },
      });
    }
    await this.audit(
      user.id,
      membership.organizationId,
      'BUSINESS_REQUIREMENT_UPDATED',
      'BusinessRequirement',
      id,
    );
    return result;
  }

  async requirementAction(user: AuthenticatedUser, id: string, action: string, reason?: string) {
    const membership = await this.membership(user.id, 'BUSINESS');
    const requirement = await this.prisma.businessRequirement.findFirst({
      where: { id, organizationId: membership.organizationId },
      include: { _count: { select: { agreements: true } } },
    });
    if (!requirement) throw new NotFoundException('Kebutuhan material tidak ditemukan');
    const status =
      action === 'publish'
        ? 'PUBLISHED'
        : action === 'unpublish'
          ? 'DRAFT'
          : action === 'close'
            ? 'CLOSED'
            : null;
    if (action === 'archive') {
      await this.prisma.businessRequirement.update({
        where: { id },
        data: {
          status: 'CLOSED',
          archivedAt: new Date(),
          archivedBy: user.id,
          archiveReason: reason,
        },
      });
    } else if (action === 'restore') {
      await this.prisma.businessRequirement.update({
        where: { id },
        data: { status: 'DRAFT', archivedAt: null, archivedBy: null, archiveReason: null },
      });
    } else if (status)
      await this.prisma.businessRequirement.update({ where: { id }, data: { status } });
    else if (action === 'delete') {
      if (requirement.status !== 'DRAFT' || requirement._count.agreements)
        throw new ConflictException('Hanya draft tanpa kesepakatan yang dapat dihapus');
      await this.prisma.businessRequirement.delete({ where: { id } });
    } else throw new BadRequestException('Aksi kebutuhan tidak valid');
    await this.audit(
      user.id,
      membership.organizationId,
      `REQUIREMENT_${action.toUpperCase()}`,
      'BusinessRequirement',
      id,
      reason,
    );
    return { id, action };
  }

  async materialCategories() {
    return this.prisma.materialCategoryMetadata.findMany({ orderBy: { displayOrder: 'asc' } });
  }

  async updateMaterialCategory(userId: string, code: MaterialType, dto: MaterialCategoryDto) {
    const result = await this.prisma.materialCategoryMetadata.upsert({
      where: { code },
      update: dto,
      create: { code, ...dto },
    });
    await this.audit(userId, null, 'MATERIAL_CATEGORY_UPDATED', 'MaterialCategoryMetadata', code);
    return result;
  }

  async archiveMaterialCategory(
    userId: string,
    code: MaterialType,
    dto: ArchiveResourceDto,
    restore = false,
  ) {
    const result = await this.prisma.materialCategoryMetadata.update({
      where: { code },
      data: restore
        ? { active: true, archivedAt: null, archivedBy: null, archiveReason: null }
        : { active: false, archivedAt: new Date(), archivedBy: userId, archiveReason: dto.reason },
    });
    await this.audit(
      userId,
      null,
      restore ? 'MATERIAL_CATEGORY_RESTORED' : 'MATERIAL_CATEGORY_ARCHIVED',
      'MaterialCategoryMetadata',
      code,
      dto.reason,
    );
    return result;
  }

  async createSupportTicket(user: AuthenticatedUser, subject: string, description: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId: user.id, active: true },
    });
    const ticket = await this.prisma.supportTicket.create({
      data: {
        organizationId: membership?.organizationId,
        createdById: user.id,
        subject,
        description,
        messages: { create: { authorId: user.id, message: description } },
      },
      include: { messages: true },
    });
    await this.audit(
      user.id,
      membership?.organizationId ?? null,
      'SUPPORT_TICKET_CREATED',
      'SupportTicket',
      ticket.id,
    );
    return ticket;
  }

  async supportTickets(user: AuthenticatedUser, platform = false) {
    return this.prisma.supportTicket.findMany({
      where: platform ? {} : { createdById: user.id },
      include: {
        organization: true,
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        messages: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async updateSupportTicket(user: AuthenticatedUser, id: string, dto: SupportTicketActionDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Tiket bantuan tidak ditemukan');
    const status = dto.status as SupportTicketStatus | undefined;
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.supportTicket.update({
        where: { id },
        data: { assignedToId: dto.assignedToId, status },
      });
      if (dto.message)
        await tx.supportTicketMessage.create({
          data: { ticketId: id, authorId: user.id, message: dto.message },
        });
      return updated;
    });
    await this.audit(
      user.id,
      ticket.organizationId ?? null,
      'SUPPORT_TICKET_UPDATED',
      'SupportTicket',
      id,
    );
    return result;
  }
}
