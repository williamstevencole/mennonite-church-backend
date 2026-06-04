import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { ChurchResponseDto } from './church.response.dto';

export class ChurchesPageResponseDto extends PaginatedResponseDto<ChurchResponseDto> {
  @ApiProperty({ type: [ChurchResponseDto] })
  declare data: ChurchResponseDto[];
}
