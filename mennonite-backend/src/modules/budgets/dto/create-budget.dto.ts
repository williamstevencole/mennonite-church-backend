import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBudgetDto {
  @ApiProperty({ example: 2027, minimum: 1900, maximum: 2100 })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({ example: 'Presupuesto aprobado en asamblea' })
  @IsOptional()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(500)
  description?: string;
}
