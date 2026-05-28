import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DayOfWeek,
  EventFrequency,
  EventStatus,
} from './create-calendar-event.dto';

export class CalendarEventResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  idChurch!: number;

  @ApiPropertyOptional({ nullable: true })
  idEventType!: number | null;

  @ApiPropertyOptional({ nullable: true })
  idMinistry!: number | null;

  @ApiProperty({ example: 'Culto dominical' })
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  location!: string | null;

  @ApiPropertyOptional({ nullable: true })
  estimatedBudget!: number | null;

  @ApiProperty({ example: false })
  isRecurrent!: boolean;

  @ApiPropertyOptional({ enum: EventFrequency, nullable: true })
  frequency!: EventFrequency | null;

  @ApiPropertyOptional({ enum: DayOfWeek, nullable: true })
  dayOfWeek!: DayOfWeek | null;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
    format: 'date',
  })
  recurrenceEndDate!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  startDatetime!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  endDatetime!: string;

  @ApiProperty({ enum: EventStatus })
  status!: EventStatus;

  @ApiPropertyOptional({ nullable: true })
  cancelReason!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  cancelledAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  cancelledBy!: number | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  createdAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  createdBy!: number | null;
}
