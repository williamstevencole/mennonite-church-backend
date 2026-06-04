import { ApiProperty } from '@nestjs/swagger';

export class EventResponsibleMemberMemberSummaryResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
}
