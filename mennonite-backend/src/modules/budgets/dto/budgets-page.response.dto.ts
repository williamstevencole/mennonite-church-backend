import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { BudgetListItemResponseDto } from './budget-list-item.response.dto';

export class BudgetsPageResponseDto extends PaginatedResponseDto<BudgetListItemResponseDto> {
  @ApiProperty({ type: [BudgetListItemResponseDto] })
  data!: BudgetListItemResponseDto[];
}
