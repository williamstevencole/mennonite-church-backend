import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateArticleDto {
  @ApiProperty()
  @IsString()
  @Transform(trim)
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9.-]+$/, {
    message:
      'code solo puede contener minusculas, numeros, puntos y guiones medios',
  })
  code!: string;

  @ApiProperty()
  @IsString()
  @Transform(trim)
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(200)
  description?: string;

  @ApiProperty()
  @Type(() => Number)
  @Min(0.01, { message: 'unitCost debe ser mayor que 0' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'unitCost debe ser un numero valido' },
  )
  unitCost!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(50)
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(50)
  model?: string;
}
