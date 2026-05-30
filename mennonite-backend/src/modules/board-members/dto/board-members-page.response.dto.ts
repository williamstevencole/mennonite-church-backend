import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { BoardMemberListItemResponseDto } from './board-member-list-item.response.dto';

export class BoardMembersPageResponseDto extends PaginatedResponseDto<BoardMemberListItemResponseDto> {
  @ApiProperty({ type: [BoardMemberListItemResponseDto] })
  declare data: BoardMemberListItemResponseDto[];
}
