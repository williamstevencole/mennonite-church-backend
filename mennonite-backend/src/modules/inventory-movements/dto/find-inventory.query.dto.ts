import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';

export enum InventoryMovementType {
  Inbound = 'Inbound',
  Outbound = 'Outbound',
}

const toNumber = ({ value }: { value: unknown }): unknown => {
  const num = Number(value);
  return isNaN(num) ? value : num;
};

export class FindInventoryMovementsQueryDto {
  @ApiPropertyOptional({ enum: InventoryMovementType })
  @IsOptional()
  @IsEnum(InventoryMovementType)
  type?: InventoryMovementType;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  articleId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
