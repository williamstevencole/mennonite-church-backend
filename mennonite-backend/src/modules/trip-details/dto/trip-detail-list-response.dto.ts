import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { TripDetailResponseDto } from './trip-detail-response.dto';

export class TripDetailListResponseDto extends PaginatedResponseDto<TripDetailResponseDto> {
  @ApiProperty({ type: [TripDetailResponseDto] })
  declare data: TripDetailResponseDto[];
}
