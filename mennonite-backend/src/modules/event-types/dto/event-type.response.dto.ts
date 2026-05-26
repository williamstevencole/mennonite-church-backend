import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventCategory } from '../event-category.enum';

export class EventTypeResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Culto Dominical' })
  name!: string;

  @ApiPropertyOptional({ enum: EventCategory, nullable: true })
  eventCategory!: EventCategory | null;
}
