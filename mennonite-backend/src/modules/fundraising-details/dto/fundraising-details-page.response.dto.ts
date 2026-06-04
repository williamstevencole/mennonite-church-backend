import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { FundraisingDetailListItemResponseDto } from './fundraising-detail-list-item.response.dto';

export class FundraisingDetailsPageResponseDto extends PaginatedResponseDto<FundraisingDetailListItemResponseDto> {
  @ApiProperty({ type: [FundraisingDetailListItemResponseDto] })
  declare data: FundraisingDetailListItemResponseDto[];
}
