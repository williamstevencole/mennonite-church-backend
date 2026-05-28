import { ApiProperty } from '@nestjs/swagger';
import { MemberAssignmentListItemResponseDto } from './member-assignment-list-item.response.dto';

export class MemberAssignmentsPageResponseDto {
  @ApiProperty({ type: [MemberAssignmentListItemResponseDto] })
  data!: MemberAssignmentListItemResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() size!: number;
}
