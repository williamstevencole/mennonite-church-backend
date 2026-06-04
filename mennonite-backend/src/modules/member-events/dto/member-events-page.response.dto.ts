import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { MemberEventListItemResponseDto } from './member-event-list-item.response.dto';

export class MemberEventsPageResponseDto extends PaginatedResponseDto<MemberEventListItemResponseDto> {
  @ApiProperty({ type: [MemberEventListItemResponseDto] })
  declare data: MemberEventListItemResponseDto[];
}
