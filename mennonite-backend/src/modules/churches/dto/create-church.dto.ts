import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateChurchDto {
  @ApiProperty({ example: 'Iglesia Menonita Central', maxLength: 100 })
  @IsString()
  @Transform(trim)
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: 'id de la ciudad sede' })
  @IsOptional()
  @IsInt()
  idCity?: number;

  @ApiPropertyOptional({ maxLength: 14 })
  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(14)
  rtn?: string;

  @ApiPropertyOptional({ maxLength: 14 })
  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(14)
  contactPhone?: string;

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(60)
  founderName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(trim)
  mission?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(trim)
  vision?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(trim)
  values?: string;

  @ApiPropertyOptional({ type: String, format: 'date', example: '1990-04-12' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  foundationDate?: Date;
}
