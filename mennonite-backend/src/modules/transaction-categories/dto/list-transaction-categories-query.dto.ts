import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TransactionCategoryType } from '../transaction-category-type.enum';

export class ListTransactionCategoriesQueryDto {
  @ApiPropertyOptional({ enum: TransactionCategoryType })
  @IsOptional()
  @IsEnum(TransactionCategoryType)
  type?: TransactionCategoryType;
}
