import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateBoardDto {
  @ApiProperty({ example: 'Junta Directiva 2026-2027' })
  @IsString()
  @Transform(trim)
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Junta electa en asamblea anual' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2027-12-31' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ description: 'Marca el concilio como activo' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
