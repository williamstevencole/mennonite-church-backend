import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return value;
};

export class ListMinistryMembersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por ministerio' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMinistry?: number;

  @ApiPropertyOptional({ description: 'Filtra por miembro' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMember?: number;

  @ApiPropertyOptional({ description: 'Filtra por estado activo' })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Si true, incluye registros inactivos',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  includeInactive?: boolean;
}
