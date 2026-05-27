import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateBoardMemberDto {
  @ApiPropertyOptional({ example: 1, description: 'Id del rol del concilio' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_board_role_type?: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
