import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { MemberListItemResponseDto } from './member-list-item.response.dto';

export class MembersPageResponseDto extends PaginatedResponseDto<MemberListItemResponseDto> {
  @ApiProperty({ type: [MemberListItemResponseDto] })
  declare data: MemberListItemResponseDto[];
}
