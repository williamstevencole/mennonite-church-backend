import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { MinistryMemberListItemResponseDto } from './ministry-member-list-item.response.dto';

export class MinistryMembersPageResponseDto extends PaginatedResponseDto<MinistryMemberListItemResponseDto> {
  @ApiProperty({ type: [MinistryMemberListItemResponseDto] })
  declare data: MinistryMemberListItemResponseDto[];
}
