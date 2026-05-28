import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min, IsOptional } from 'class-validator';

export class UpdateBudgetDistributionDto {
  @ApiPropertyOptional({
    example: 30,
    description: 'Nuevo porcentaje asignado al ministerio (0-100)',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsOptional()
  percentage?: number;
}
