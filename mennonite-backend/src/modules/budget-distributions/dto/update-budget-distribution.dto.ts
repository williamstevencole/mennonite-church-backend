import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateBudgetDistributionDto {
  @ApiPropertyOptional({
    example: 62500,
    description: 'Nuevo monto anual asignado al ministerio en Lempiras',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  annualAmount?: number;
}
