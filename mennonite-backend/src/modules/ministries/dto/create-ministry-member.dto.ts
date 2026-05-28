import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, Min } from 'class-validator';

export class CreateMinistryMemberDto {
  @ApiProperty({ example: 1, description: 'Id del miembro' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_member!: number;

  @ApiProperty({ example: 1, description: 'Id del rol del ministerio' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_ministry_role_type!: number;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  start_date!: string;
}
