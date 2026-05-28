import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum InventoryMovementType {
  Inbound = 'Inbound',
  Outbound = 'Outbound',
}

export class CreateInventoryMovementDto {
  @IsEnum(InventoryMovementType)
  type!: InventoryMovementType;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsDateString()
  datetime!: string;

  @IsInt()
  idArticle!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
