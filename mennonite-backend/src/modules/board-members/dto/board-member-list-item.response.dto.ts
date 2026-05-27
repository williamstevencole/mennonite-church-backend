import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoardMemberMemberSummaryResponseDto } from './board-member-member-summary.response.dto';
import { BoardMemberRoleResponseDto } from './board-member-role.response.dto';

export class BoardMemberListItemResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ type: BoardMemberMemberSummaryResponseDto })
  member!: BoardMemberMemberSummaryResponseDto;
  @ApiProperty({ type: BoardMemberRoleResponseDto })
  role!: BoardMemberRoleResponseDto;
  @ApiProperty() startDate!: Date;
  @ApiPropertyOptional({ nullable: true })
  endDate!: Date | null;
  @ApiProperty() active!: boolean;
}
