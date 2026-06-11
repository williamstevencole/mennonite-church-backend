import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trimToUndefined = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || undefined : value;

const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return value;
};

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  @Transform(trimToUndefined)
  @MinLength(1)
  @MaxLength(60)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Perez' })
  @IsOptional()
  @IsString()
  @Transform(trimToUndefined)
  @MinLength(1)
  @MaxLength(60)
  lastName?: string;

  @ApiPropertyOptional({ example: 'usuario@iglesia.org' })
  @IsOptional()
  @IsEmail()
  @Transform(normalizeEmail)
  email?: string;

  @ApiPropertyOptional({ example: 'MiPassword123!' })
  @IsOptional()
  @IsString()
  @Transform(trimToUndefined)
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  active?: boolean;
}
