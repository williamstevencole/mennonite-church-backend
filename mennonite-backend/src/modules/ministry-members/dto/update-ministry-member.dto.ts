import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return value;
};

export class UpdateMinistryMemberDto {
  @ApiPropertyOptional({ example: 1, description: 'Id del rol del ministerio' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMinistryRoleType?: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Estado activo de la asignacion' })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  active?: boolean;
}
