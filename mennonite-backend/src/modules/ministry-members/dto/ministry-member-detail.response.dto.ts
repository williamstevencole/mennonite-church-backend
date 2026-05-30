import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MinistryMemberMemberSummaryResponseDto } from './ministry-member-member-summary.response.dto';
import { MinistryMemberMinistrySummaryResponseDto } from './ministry-member-ministry-summary.response.dto';
import { MinistryMemberRoleResponseDto } from './ministry-member-role.response.dto';

export class MinistryMemberDetailResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ type: MinistryMemberMemberSummaryResponseDto })
  member!: MinistryMemberMemberSummaryResponseDto;
  @ApiProperty({ type: MinistryMemberMinistrySummaryResponseDto })
  ministry!: MinistryMemberMinistrySummaryResponseDto;
  @ApiProperty({ type: MinistryMemberRoleResponseDto })
  role!: MinistryMemberRoleResponseDto;
  @ApiProperty() startDate!: Date;
  @ApiPropertyOptional({ nullable: true })
  endDate!: Date | null;
  @ApiProperty() active!: boolean;
  @ApiPropertyOptional({ nullable: true })
  createdAt!: Date | null;
  @ApiPropertyOptional({ nullable: true })
  createdBy!: number | null;
}
