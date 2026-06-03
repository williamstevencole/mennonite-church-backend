import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateBudgetCategoryDto {
  @ApiPropertyOptional({
    example: 140000,
    description: 'Nuevo monto anual presupuestado (max 2 decimales)',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  annualAmount?: number;

  @ApiPropertyOptional({ example: 'Ajuste por inflacion' })
  @IsOptional()
  @IsString()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string;
}
