import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MaterialType } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import { PivotCrudService } from './crud.service';
import {
  ArchiveResourceDto,
  CreateSupportTicketDto,
  CrudListQueryDto,
  CrudMutationDto,
  LifecycleActionDto,
  MaterialCategoryDto,
  SupportTicketActionDto,
} from './dto/crud.dto';

@ApiTags('Manager CRUD')
@ApiBearerAuth()
@Roles('MANAGER_ADMIN', 'MANAGER_OPERATOR')
@Controller({ path: 'manager/resources', version: '1' })
export class ManagerCrudController {
  constructor(private readonly service: PivotCrudService) {}

  @Get(':resource')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resource') resource: string,
    @Query() query: CrudListQueryDto,
  ) {
    return this.service.listManager(user.id, resource, query);
  }

  @Get(':resource/:id')
  detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resource') resource: string,
    @Param('id') id: string,
  ) {
    return this.service.getManager(user.id, resource, id);
  }

  @Post(':resource')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resource') resource: string,
    @Body() dto: CrudMutationDto,
  ) {
    return this.service.createManager(user, resource, dto.data);
  }

  @Patch(':resource/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Body() dto: CrudMutationDto,
  ) {
    return this.service.updateManager(user, resource, id, dto.data);
  }

  @Post(':resource/:id/archive')
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Body() dto: ArchiveResourceDto,
  ) {
    return this.service.archiveManager(user, resource, id, dto);
  }

  @Post(':resource/:id/restore')
  restore(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Body() dto: ArchiveResourceDto,
  ) {
    return this.service.archiveManager(user, resource, id, dto, true);
  }

  @Post(':resource/:id/action')
  action(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Body() dto: LifecycleActionDto,
  ) {
    return this.service.managerAction(user, resource, id, dto.action, dto.reason);
  }

  @Delete(':resource/:id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resource') resource: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteManagerDraft(user, resource, id);
  }
}

@ApiTags('Business CRUD')
@ApiBearerAuth()
@Roles('BUSINESS_BUYER')
@Controller({ path: 'business/resources', version: '1' })
export class BusinessCrudController {
  constructor(private readonly service: PivotCrudService) {}

  @Get('requirements')
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: CrudListQueryDto) {
    return this.service.listRequirements(user.id, query);
  }

  @Patch('requirements/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CrudMutationDto,
  ) {
    return this.service.updateRequirement(user, id, dto.data);
  }

  @Post('requirements/:id/action')
  action(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: LifecycleActionDto,
  ) {
    return this.service.requirementAction(user, id, dto.action, dto.reason);
  }
}

@ApiTags('Platform catalogs and support')
@ApiBearerAuth()
@Controller({ path: 'platform-management', version: '1' })
export class PlatformManagementController {
  constructor(private readonly service: PivotCrudService) {}

  @Roles('PLATFORM_ADMIN') @Get('material-categories') categories() {
    return this.service.materialCategories();
  }

  @Roles('PLATFORM_ADMIN') @Patch('material-categories/:code') category(
    @CurrentUser() user: AuthenticatedUser,
    @Param('code') code: MaterialType,
    @Body() dto: MaterialCategoryDto,
  ) {
    return this.service.updateMaterialCategory(user.id, code, dto);
  }

  @Roles('PLATFORM_ADMIN') @Post('material-categories/:code/archive') archiveCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('code') code: MaterialType,
    @Body() dto: ArchiveResourceDto,
  ) {
    return this.service.archiveMaterialCategory(user.id, code, dto);
  }

  @Roles('PLATFORM_ADMIN') @Post('material-categories/:code/restore') restoreCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('code') code: MaterialType,
    @Body() dto: ArchiveResourceDto,
  ) {
    return this.service.archiveMaterialCategory(user.id, code, dto, true);
  }

  @Post('support-tickets') createTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSupportTicketDto,
  ) {
    return this.service.createSupportTicket(user, dto.subject, dto.description);
  }

  @Get('support-tickets/mine') myTickets(@CurrentUser() user: AuthenticatedUser) {
    return this.service.supportTickets(user);
  }

  @Roles('PLATFORM_ADMIN') @Get('support-tickets') tickets(@CurrentUser() user: AuthenticatedUser) {
    return this.service.supportTickets(user, true);
  }

  @Roles('PLATFORM_ADMIN') @Patch('support-tickets/:id') updateTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SupportTicketActionDto,
  ) {
    return this.service.updateSupportTicket(user, id, dto);
  }
}
