import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AvailabilityQueryDto {
  @ApiPropertyOptional({
    minimum: 1900,
    maximum: 2100,
    description:
      'Año en curso para el cálculo del delta. Default: año actual del servidor.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;
}
