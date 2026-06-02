import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export enum FinancialReportType {
  ANNUAL = 'annual',
  QUARTERLY = 'quarterly',
  MONTHLY = 'monthly',
}

export class CreateFinancialReportDto {
  @ApiPropertyOptional({
    example: 5,
    description: 'Id del ministerio. NULL = reporte global de la iglesia',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMinistry?: number;

  @ApiProperty({ enum: FinancialReportType, example: 'annual' })
  @IsEnum(FinancialReportType)
  reportType!: FinancialReportType;

  @ApiProperty({ example: '2026-01-01' })
  @IsISO8601({ strict: true })
  periodStart!: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsISO8601({ strict: true })
  periodEnd!: string;

  @ApiProperty({
    example: 'Reporte Anual 2026 - Ministerio de Jóvenes',
    maxLength: 100,
  })
  @IsString()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MaxLength(100)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  summary?: string;

  @ApiPropertyOptional({ example: 12000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalIncome?: number;

  @ApiPropertyOptional({ example: 8000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalExpenses?: number;
}
