import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { EventTypeResponseDto } from './event-type.response.dto';

export class EventTypesPageResponseDto extends PaginatedResponseDto<EventTypeResponseDto> {
  @ApiProperty({ type: [EventTypeResponseDto] })
  declare data: EventTypeResponseDto[];
}
