import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class CreateUserDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  @Transform(trim)
  @MinLength(1)
  @MaxLength(60)
  first_name!: string;

  @ApiProperty({ example: 'Perez' })
  @IsString()
  @Transform(trim)
  @MinLength(1)
  @MaxLength(60)
  last_name!: string;

  @ApiProperty({ example: 'usuario@iglesia.org' })
  @IsEmail()
  @Transform(normalizeEmail)
  email!: string;

  @ApiProperty({ example: 'MiPassword123!' })
  @IsString()
  @Transform(trim)
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_role!: number;
}
