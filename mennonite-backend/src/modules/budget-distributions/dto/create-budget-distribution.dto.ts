import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, Min } from 'class-validator';

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
    description: 'Id del ministerio que recibe el monto anual',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMinistry!: number;

  @ApiProperty({
    example: 50000,
    description: 'Monto anual asignado al ministerio en Lempiras',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  annualAmount!: number;
}
