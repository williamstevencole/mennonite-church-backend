import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateBoardMemberDto {
  @ApiProperty({ example: 1, description: 'Id del concilio' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_board!: number;

  @ApiProperty({ example: 1, description: 'Id del miembro' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_member!: number;

  @ApiProperty({ example: 1, description: 'Id del rol del concilio' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_board_role_type!: number;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  start_date!: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
