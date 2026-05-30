import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { BudgetDistributionResponseDto } from './budget-distribution.response.dto';

export class BudgetDistributionsPageResponseDto extends PaginatedResponseDto<BudgetDistributionResponseDto> {
  @ApiProperty({ type: [BudgetDistributionResponseDto] })
  declare data: BudgetDistributionResponseDto[];
}
