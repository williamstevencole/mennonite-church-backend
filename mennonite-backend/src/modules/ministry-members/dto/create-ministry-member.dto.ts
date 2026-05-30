import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateMinistryMemberDto {
  @ApiProperty({ example: 1, description: 'Id del miembro' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMember!: number;

  @ApiProperty({ example: 1, description: 'Id del ministerio' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMinistry!: number;

  @ApiProperty({ example: 1, description: 'Id del rol del ministerio' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMinistryRoleType!: number;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
