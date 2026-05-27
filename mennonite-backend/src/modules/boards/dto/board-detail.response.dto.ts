import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoardMemberListItemResponseDto } from '../../board-members/dto/board-member-list-item.response.dto';

export class BoardDetailResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true })
  description!: string | null;
  @ApiProperty() startDate!: Date;
  @ApiPropertyOptional({ nullable: true })
  endDate!: Date | null;
  @ApiProperty() active!: boolean;
  @ApiProperty({ type: BoardMemberListItemResponseDto, isArray: true })
  members!: BoardMemberListItemResponseDto[];
}
