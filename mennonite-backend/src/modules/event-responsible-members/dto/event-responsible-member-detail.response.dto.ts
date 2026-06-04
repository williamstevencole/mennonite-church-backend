import { ApiProperty } from '@nestjs/swagger';
import { EventResponsibleMemberEventSummaryResponseDto } from './event-responsible-member-event-summary.response.dto';
import { EventResponsibleMemberMemberSummaryResponseDto } from './event-responsible-member-member-summary.response.dto';

export class EventResponsibleMemberDetailResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ type: EventResponsibleMemberEventSummaryResponseDto })
  event!: EventResponsibleMemberEventSummaryResponseDto;
  @ApiProperty({ type: EventResponsibleMemberMemberSummaryResponseDto })
  member!: EventResponsibleMemberMemberSummaryResponseDto;
}
