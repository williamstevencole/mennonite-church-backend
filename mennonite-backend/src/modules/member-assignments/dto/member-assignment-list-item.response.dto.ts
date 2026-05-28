import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberAssignmentType } from '../member-assignment-type.enum';
import { MemberAssignmentMemberSummaryResponseDto } from './member-assignment-member-summary.response.dto';
import { MemberAssignmentRoleResponseDto } from './member-assignment-role.response.dto';
import { MemberAssignmentTargetResponseDto } from './member-assignment-target.response.dto';

export class MemberAssignmentListItemResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ enum: MemberAssignmentType })
  assignmentType!: MemberAssignmentType;
  @ApiProperty({ type: MemberAssignmentMemberSummaryResponseDto })
  member!: MemberAssignmentMemberSummaryResponseDto;
  @ApiProperty({ type: MemberAssignmentRoleResponseDto })
  role!: MemberAssignmentRoleResponseDto;
  @ApiPropertyOptional({
    type: MemberAssignmentTargetResponseDto,
    nullable: true,
  })
  target!: MemberAssignmentTargetResponseDto | null;
  @ApiProperty() startDate!: Date;
  @ApiPropertyOptional({ nullable: true })
  endDate!: Date | null;
  @ApiProperty() active!: boolean;
}
