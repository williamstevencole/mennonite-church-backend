import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

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

export class ListUsersQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number;

  @ApiPropertyOptional({ description: 'Filtra por nombre del miembro' })
  @IsOptional()
  @IsString()
  @Transform(trimToUndefined)
  name?: string;

  @ApiPropertyOptional({ description: 'Filtra por rol' })
  @IsOptional()
  @IsString()
  @Transform(trimToUndefined)
  role?: string;

  @ApiPropertyOptional({ description: 'Filtra por estado activo' })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  active?: boolean;
}
