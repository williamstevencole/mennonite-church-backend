import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateMemberEventDto {
  @ApiProperty({ example: 1, description: 'Id del evento' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idEvent!: number;

  @ApiProperty({ example: 1, description: 'Id del miembro' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMember!: number;

  @ApiProperty({ example: true, description: 'atendio el evento' })
  @Type(() => Boolean)
  @IsBoolean()
  attended!: boolean;

  @ApiPropertyOptional({ description: 'Notas' })
  @IsOptional()
  @IsString()
  notes?: string;
}
