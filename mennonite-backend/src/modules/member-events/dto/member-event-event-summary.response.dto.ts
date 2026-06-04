import { ApiProperty } from '@nestjs/swagger';

export class MemberEventEventSummaryResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
}
