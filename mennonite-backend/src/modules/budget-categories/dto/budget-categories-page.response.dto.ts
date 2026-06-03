import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { BudgetCategoryResponseDto } from './budget-category.response.dto';

export class BudgetCategoriesPageResponseDto extends PaginatedResponseDto<BudgetCategoryResponseDto> {
  @ApiProperty({ type: [BudgetCategoryResponseDto] })
  declare data: BudgetCategoryResponseDto[];
}
