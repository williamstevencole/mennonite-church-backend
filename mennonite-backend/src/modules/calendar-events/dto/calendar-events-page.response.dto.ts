import { ApiProperty } from '@nestjs/swagger';
import { CalendarEventResponseDto } from './calendar-event.response.dto';

export class CalendarEventsPageResponseDto {
  @ApiProperty({ type: [CalendarEventResponseDto] })
  data!: CalendarEventResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() size!: number;
}
