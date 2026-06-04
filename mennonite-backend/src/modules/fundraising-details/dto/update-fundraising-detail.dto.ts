import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateFundraisingDetailDto {
  @ApiPropertyOptional({
    example: 7500.0,
    description: 'Nuevo monto objetivo de recaudacion',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  targetAmount?: number;

  @ApiPropertyOptional({ example: 'Notas actualizadas' })
  @IsOptional()
  @IsString()
  notes?: string;
}
