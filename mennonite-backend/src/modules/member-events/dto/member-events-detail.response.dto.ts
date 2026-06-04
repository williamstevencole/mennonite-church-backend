import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberEventMemberSummaryResponseDto } from './member-event-member-summary.response.dto';
import { MemberEventEventSummaryResponseDto } from './member-event-event-summary.response.dto';

export class MemberEventDetailResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ type: MemberEventMemberSummaryResponseDto })
  member!: MemberEventMemberSummaryResponseDto;
  @ApiProperty({ type: MemberEventEventSummaryResponseDto })
  event!: MemberEventEventSummaryResponseDto;
  @ApiProperty() attended!: boolean;
  @ApiPropertyOptional({ nullable: true }) notes!: string | null;
  @ApiPropertyOptional({ nullable: true }) createdAt!: Date | null;
}
