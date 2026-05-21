import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
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

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  @Transform(trimToUndefined)
  @MinLength(1)
  @MaxLength(60)
  first_name?: string;

  @ApiPropertyOptional({ example: 'Perez' })
  @IsOptional()
  @IsString()
  @Transform(trimToUndefined)
  @MinLength(1)
  @MaxLength(60)
  last_name?: string;

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
}
