import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateBudgetDto {
  @ApiPropertyOptional({ example: 'Presupuesto revisado en asamblea de marzo' })
  @IsOptional()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: 1800000,
    description: 'Nuevo total ingresos planificado en Lempiras',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  expectedIncome?: number;

  @ApiPropertyOptional({
    example: 1700000,
    description: 'Nuevo total egresos planificado en Lempiras',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  expectedExpense?: number;
}
