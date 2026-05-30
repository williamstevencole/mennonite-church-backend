import { ApiProperty } from '@nestjs/swagger';

export class MinistryMemberMinistrySummaryResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
}
