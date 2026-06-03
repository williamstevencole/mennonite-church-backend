import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBudgetCategoryDto {
  @ApiProperty({
    example: 1,
    description: 'Id del presupuesto al que se asigna la categoria',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idBudget!: number;

  @ApiProperty({
    example: 5,
    description: 'Id de la categoria de transaccion',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idCategory!: number;

  @ApiProperty({
    example: 120000,
    description: 'Monto anual presupuestado (max 2 decimales)',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  annualAmount!: number;

  @ApiPropertyOptional({ example: 'Asignacion anual base' })
  @IsOptional()
  @IsString()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string;
}
