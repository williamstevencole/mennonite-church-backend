import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MinistryMemberMemberSummaryResponseDto } from './ministry-member-member-summary.response.dto';
import { MinistryMemberRoleResponseDto } from './ministry-member-role.response.dto';

export class MinistryMemberListItemResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ type: MinistryMemberMemberSummaryResponseDto })
  member!: MinistryMemberMemberSummaryResponseDto;
  @ApiProperty({ type: MinistryMemberRoleResponseDto })
  role!: MinistryMemberRoleResponseDto;
  @ApiProperty() startDate!: Date;
  @ApiPropertyOptional({ nullable: true })
  endDate!: Date | null;
  @ApiProperty() active!: boolean;
}
