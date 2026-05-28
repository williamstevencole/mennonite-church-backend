import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum EventFrequency {
  Daily = 'daily',
  Weekly = 'weekly',
  Biweekly = 'biweekly',
  Monthly = 'monthly',
}

export enum DayOfWeek {
  Monday = 'monday',
  Tuesday = 'tuesday',
  Wednesday = 'wednesday',
  Thursday = 'thursday',
  Friday = 'friday',
  Saturday = 'saturday',
  Sunday = 'sunday',
}

export enum EventStatus {
  Planned = 'Planned',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export class CreateCalendarEventDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  idChurch!: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  idEventType?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'NULL = evento de toda la iglesia',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  idMinistry?: number;

  @ApiProperty({ example: 'Culto dominical', maxLength: 100 })
  @IsString()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ example: 1500.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  estimatedBudget?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRecurrent?: boolean = false;

  @ApiPropertyOptional({
    enum: EventFrequency,
    description: 'Requerido cuando isRecurrent=true',
  })
  @IsOptional()
  @IsEnum(EventFrequency)
  frequency?: EventFrequency;

  @ApiPropertyOptional({
    enum: DayOfWeek,
    description: 'Solo cuando frequency=weekly',
  })
  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'NULL = recurrencia indefinida',
  })
  @IsOptional()
  @IsDateString()
  recurrenceEndDate?: string;

  @ApiProperty({ example: '2026-06-01T10:00:00Z' })
  @IsDateString()
  startDatetime!: string;

  @ApiProperty({ example: '2026-06-01T12:00:00Z' })
  @IsDateString()
  endDatetime!: string;

  @ApiPropertyOptional({ enum: EventStatus, default: EventStatus.Planned })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
