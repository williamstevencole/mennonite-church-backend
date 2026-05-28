import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMinistryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_leader_member?: number | null;

  @ApiPropertyOptional({ example: 'Monday' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  meeting_day?: string | null;

  @ApiPropertyOptional({ example: '18:30' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  meeting_time?: string | null;
}
