import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberEventMemberSummaryResponseDto } from './member-event-member-summary.response.dto';
import { MemberEventEventSummaryResponseDto } from './member-event-event-summary.response.dto';

export class MemberEventListItemResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ type: MemberEventEventSummaryResponseDto })
  event!: MemberEventEventSummaryResponseDto;
  @ApiProperty({ type: MemberEventMemberSummaryResponseDto })
  member!: MemberEventMemberSummaryResponseDto;
  @ApiProperty()
  attended!: boolean;
  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;
}
