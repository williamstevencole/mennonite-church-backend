import { ApiProperty } from '@nestjs/swagger';

export class MinistryMemberMemberSummaryResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
}
