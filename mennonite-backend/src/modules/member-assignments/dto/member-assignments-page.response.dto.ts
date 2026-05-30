import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { MemberAssignmentListItemResponseDto } from './member-assignment-list-item.response.dto';

export class MemberAssignmentsPageResponseDto extends PaginatedResponseDto<MemberAssignmentListItemResponseDto> {
  @ApiProperty({ type: [MemberAssignmentListItemResponseDto] })
  declare data: MemberAssignmentListItemResponseDto[];
}
