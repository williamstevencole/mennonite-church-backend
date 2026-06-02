import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePeriodClosureDto {
  @ApiProperty({ example: 2025, minimum: 1900, maximum: 2100 })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year!: number;

  @ApiProperty({
    example: 80930,
    minimum: 0,
    description: 'Caja chica + cuenta corriente operativa',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  ownFunds!: number;

  @ApiProperty({
    example: 500000,
    minimum: 0,
    description: 'Ahorros historicos para emergencias o proyectos',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  accumulatedReserve!: number;

  @ApiPropertyOptional({
    example: '2025-12-31',
    description: 'Fecha del cierre (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  closureDate?: string;

  @ApiPropertyOptional({ example: 'Cierre aprobado en asamblea de enero' })
  @IsOptional()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
