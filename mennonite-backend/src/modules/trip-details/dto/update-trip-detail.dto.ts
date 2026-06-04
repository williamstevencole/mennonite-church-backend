import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTripDetailDto {
  @ApiPropertyOptional({ example: 'Tegucigalpa' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  origin?: string;

  @ApiPropertyOptional({ example: 'San Pedro Sula' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  destination?: string;

  @ApiPropertyOptional({ example: 'Bring water' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;
}
