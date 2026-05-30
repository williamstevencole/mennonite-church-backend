import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { CalendarEventResponseDto } from './calendar-event.response.dto';

export class CalendarEventsPageResponseDto extends PaginatedResponseDto<CalendarEventResponseDto> {
  @ApiProperty({ type: [CalendarEventResponseDto] })
  declare data: CalendarEventResponseDto[];
}
