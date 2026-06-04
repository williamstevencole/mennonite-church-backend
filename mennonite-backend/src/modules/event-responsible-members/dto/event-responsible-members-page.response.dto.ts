import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { EventResponsibleMemberListItemResponseDto } from './event-responsible-member-list-item.response.dto';

export class EventResponsibleMembersPageResponseDto extends PaginatedResponseDto<EventResponsibleMemberListItemResponseDto> {
  @ApiProperty({ type: [EventResponsibleMemberListItemResponseDto] })
  declare data: EventResponsibleMemberListItemResponseDto[];
}
