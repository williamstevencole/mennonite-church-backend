import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EventCategory } from '../event-category.enum';

export class CreateEventTypeDto {
  @ApiProperty({ example: 'Culto Dominical', maxLength: 80 })
  @IsString()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({
    enum: EventCategory,
    example: EventCategory.CalendarEvent,
  })
  @IsOptional()
  @IsEnum(EventCategory)
  eventCategory?: EventCategory;
}
