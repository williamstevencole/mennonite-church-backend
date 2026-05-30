import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { TransactionCategoryType } from '../transaction-category-type.enum';

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return value;
};

export class ListTransactionCategoriesQueryDto {
  @ApiPropertyOptional({ enum: TransactionCategoryType })
  @IsOptional()
  @IsEnum(TransactionCategoryType)
  type?: TransactionCategoryType;

  @ApiPropertyOptional({
    description: 'Si true, incluye registros inactivos',
    default: false,
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  includeInactive?: boolean;
}
