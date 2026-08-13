import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsObject, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CrudListQueryDto {
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) page = 1;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsIn(['asc', 'desc']) sort: 'asc' | 'desc' = 'desc';
  @IsOptional() @Transform(({ value }) => value === 'true') archived = false;
}

export class CrudMutationDto {
  @IsObject() data!: Record<string, unknown>;
}

export class ArchiveResourceDto {
  @IsString() @Length(5, 500) reason!: string;
}

export class LifecycleActionDto {
  @IsString() @Length(2, 40) action!: string;
  @IsOptional() @IsString() @Length(3, 500) reason?: string;
  @IsOptional() @IsObject() data?: Record<string, unknown>;
}

export class MaterialCategoryDto {
  @IsString() @Length(2, 100) publicName!: string;
  @IsString() @Length(5, 1000) description!: string;
  @IsOptional() @IsString() preparation?: string;
  @IsOptional() @IsString() icon?: string;
  @Transform(({ value }) => Number(value)) @IsInt() @Min(0) displayOrder!: number;
}

export class CreateSupportTicketDto {
  @IsString() @Length(5, 180) subject!: string;
  @IsString() @Length(10, 2000) description!: string;
}

export class SupportTicketActionDto {
  @IsOptional() @IsString() assignedToId?: string;
  @IsOptional() @IsString() @Length(2, 40) status?: string;
  @IsOptional() @IsString() @Length(2, 2000) message?: string;
}
