import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoardMemberMemberDetailResponseDto } from './board-member-member-detail.response.dto';
import { BoardMemberRoleResponseDto } from './board-member-role.response.dto';

export class BoardMemberDetailResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ type: BoardMemberMemberDetailResponseDto })
  member!: BoardMemberMemberDetailResponseDto;
  @ApiProperty({ type: BoardMemberRoleResponseDto })
  role!: BoardMemberRoleResponseDto;
  @ApiProperty() startDate!: Date;
  @ApiPropertyOptional({ nullable: true })
  endDate!: Date | null;
  @ApiProperty() active!: boolean;
}
