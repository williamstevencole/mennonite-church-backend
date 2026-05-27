import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateBoardDto {
  @ApiProperty({ example: 'Junta Directiva 2026-2027' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  start_date!: string;

  @ApiProperty({ example: '2027-12-31' })
  @IsDateString()
  end_date!: string;

  @ApiPropertyOptional({ description: 'Marca el concilio como activo' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
