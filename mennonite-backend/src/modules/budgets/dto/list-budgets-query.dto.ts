import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export enum BudgetStatusFilter {
  DRAFT = 'Draft',
  ACTIVE = 'Active',
  CLOSED = 'Closed',
}

export class ListBudgetsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: BudgetStatusFilter })
  @IsOptional()
  @IsEnum(BudgetStatusFilter)
  status?: BudgetStatusFilter;
}
