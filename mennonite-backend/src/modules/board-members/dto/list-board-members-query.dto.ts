import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

const trimToUndefined = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || undefined : value;

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return value;
};

export class ListBoardMembersQueryDto extends PaginationQueryDto {
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

  @ApiPropertyOptional({
    description: 'Filtra por rol (id o nombre del rol)',
  })
  @IsOptional()
  @IsString()
  @Transform(trimToUndefined)
  role?: string;
}
