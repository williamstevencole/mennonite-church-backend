import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, Min, Max } from 'class-validator';

export class CreateBudgetDistributionDto {
  @ApiProperty({
    example: 1,
    description: 'Id del presupuesto al que se asigna la distribución',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idBudget!: number;

  @ApiProperty({
    example: 3,
    description: 'Id del ministerio que recibe el porcentaje',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMinistry!: number;

  @ApiProperty({
    example: 25,
    description: 'Porcentaje del presupuesto asignado al ministerio (0-100)',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  percentage!: number;
}
