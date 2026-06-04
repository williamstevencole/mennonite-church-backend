import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFundraisingDetailDto {
  @ApiProperty({ example: 5, description: 'ID del evento de recaudacion' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idEvent!: number;

  @ApiPropertyOptional({
    example: 5000.0,
    description: 'Monto objetivo de recaudacion',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  targetAmount?: number;

  @ApiPropertyOptional({ example: 'Notas adicionales del evento' })
  @IsOptional()
  @IsString()
  notes?: string;
}
