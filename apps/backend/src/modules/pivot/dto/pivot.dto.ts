import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { MaterialType, OrganizationType, WeightDirection, WeightSource } from '@prisma/client';

export class UpdateApplicationDto {
  @IsString() @Length(3, 180) organizationName!: string;
  @IsEnum(OrganizationType) organizationType!: OrganizationType;
  @IsString() @Length(2, 120) responsibleName!: string;
  @IsString() @Length(8, 20) contactPhone!: string;
  @IsString() @Length(5, 255) address!: string;
  @IsArray() @IsString({ each: true }) serviceRegions!: string[];
  @IsOptional() @IsString() authorityBasis?: string;
  @IsArray() @IsString({ each: true }) managedFacilities!: string[];
  @IsArray() @IsEnum(MaterialType, { each: true }) acceptedMaterials!: MaterialType[];
  @IsOptional() @IsString() capacityNote?: string;
  @IsOptional() @IsString() receivingSchedule?: string;
  @IsOptional() @IsString() qualityNotes?: string;
  @IsBoolean() declarationAccepted!: boolean;
}

export class ReviewReasonDto {
  @IsString() @Length(5, 1000) reason!: string;
}

export class MockPaymentDto {
  @IsString() @Length(5, 100) idempotencyKey!: string;
  @IsString() @Length(3, 50) method!: string;
}

export class CardTapDto {
  @IsString() @Length(3, 100) credential!: string;
  @IsString() @Length(5, 100) deviceEventId!: string;
  @IsString() @Length(3, 32) source!: string;
}

export class CreateWeightEventDto {
  @IsString() intakeBatchId!: string;
  @IsOptional() @IsString() sortingBatchId?: string;
  @IsOptional() @IsString() collectorId?: string;
  @IsOptional() @IsString() scaleChannelId?: string;
  @IsString() @Length(5, 100) deviceEventId!: string;
  @IsEnum(WeightDirection) direction!: WeightDirection;
  @IsEnum(WeightSource) source!: WeightSource;
  @IsEnum(MaterialType) material!: MaterialType;
  @Transform(({ value }) => Number(value)) @IsNumber() @Min(0.01) weightKg!: number;
  @IsOptional() @IsString() note?: string;
}

export class CreateIntakeBatchDto {
  @IsOptional() @IsString() stationId?: string;
  @IsOptional() @IsString() @Length(3, 80) batchNo?: string;
}

export class CreateCollectionRouteDto {
  @IsString() serviceAreaId!: string;
  @IsString() @Length(3, 120) name!: string;
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) stops!: string[];
}

export class CreateCollectionRunDto {
  @IsString() routeId!: string;
  @IsString() collectorId!: string;
  @IsOptional() @IsString() vehicleId?: string;
  @IsISO8601() scheduledFor!: string;
}

export class CreateCollectorDto {
  @IsString() @Length(3, 120) name!: string;
  @IsString() @Length(8, 20) phone!: string;
  @IsString() @Length(3, 40) employeeNo!: string;
  @IsString() @Length(8, 100) initialPassword!: string;
}

export class IssueCollectorCardDto {
  @IsString() @Length(3, 32) cardNumber!: string;
  @IsOptional() @IsString() @Length(3, 100) uidCredential?: string;
}

export class CreateRequirementDto {
  @IsString() @Length(3, 160) title!: string;
  @IsEnum(MaterialType) material!: MaterialType;
  @Transform(({ value }) => Number(value)) @IsNumber() @Min(1) quantityKg!: number;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(0) pricePerKg?: number;
  @IsString() @Length(3, 180) region!: string;
}

export class CreateLotDto {
  @IsEnum(MaterialType) material!: MaterialType;
  @Transform(({ value }) => Number(value)) @IsNumber() @Min(1) quantityKg!: number;
  @Transform(({ value }) => Number(value)) @IsInt() @Min(0) pricePerKg!: number;
}

export class CreateOrderDto {
  @IsString() lotId!: string;
  @Transform(({ value }) => Number(value)) @IsNumber() @Min(1) quantityKg!: number;
}

export class ReceiveOrderDto {
  @Transform(({ value }) => Number(value)) @IsNumber() @Min(0.01) receivedKg!: number;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsNumber() @Min(0) residueKg?: number;
  @IsOptional() @IsString() note?: string;
}

export class UpdateStopDto {
  @IsString() @Length(3, 30) status!: string;
  @IsOptional() @IsString() issueNote?: string;
}

export class ResolveReportDto {
  @IsString() @Length(5, 1000) note!: string;
}

export class CreateWasteReportDto {
  @IsString() @Length(5, 1000) description!: string;
  @IsString() @Length(5, 255) address!: string;
  @Transform(({ value }) => Number(value)) @IsNumber() lat!: number;
  @Transform(({ value }) => Number(value)) @IsNumber() lng!: number;
  @IsOptional() @IsString() photoKey?: string;
}

export class UpsertFacilityDto {
  @IsString() @Length(3, 180) name!: string;
  @IsString() @Length(3, 180) operatorName!: string;
  @IsString() @Length(5, 255) address!: string;
  @Transform(({ value }) => Number(value)) @IsNumber() lat!: number;
  @Transform(({ value }) => Number(value)) @IsNumber() lng!: number;
  @IsString() @Length(5, 500) sourceUrl!: string;
  @IsOptional() @IsString() openingNote?: string;
  @IsArray() @IsEnum(MaterialType, { each: true }) materials!: MaterialType[];
}
