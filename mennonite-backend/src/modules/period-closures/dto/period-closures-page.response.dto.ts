import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { PeriodClosureResponseDto } from './period-closure.response.dto';

export class PeriodClosuresPageResponseDto extends PaginatedResponseDto<PeriodClosureResponseDto> {
  @ApiProperty({ type: [PeriodClosureResponseDto] })
  data!: PeriodClosureResponseDto[];
}
