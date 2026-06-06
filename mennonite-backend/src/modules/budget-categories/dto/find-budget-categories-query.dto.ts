import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import { TransactionCategoryType } from '../../transaction-categories/transaction-category-type.enum';

export class FindBudgetCategoriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ['income', 'expense'],
    description: 'Filtrar por tipo de categoria (income / expense)',
  })
  @IsOptional()
  @IsIn(['income', 'expense'])
  type?: TransactionCategoryType;
}
