import { ApiProperty } from '@nestjs/swagger';

export class EventResponsibleMemberEventSummaryResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() title!: string;
}
