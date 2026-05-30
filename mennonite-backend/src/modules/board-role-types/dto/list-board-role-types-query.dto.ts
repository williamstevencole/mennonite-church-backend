import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
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

const trimToUndefined = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || undefined : value;

export class ListBoardRoleTypesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra por id de concilio dueño del cargo',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idBoard?: number;

  @ApiPropertyOptional({ description: 'Filtra por estado activo' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Si true, incluye registros inactivos',
    default: false,
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  includeInactive?: boolean;

  @ApiPropertyOptional({ description: 'Busqueda por nombre (contiene)' })
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  q?: string;
}
