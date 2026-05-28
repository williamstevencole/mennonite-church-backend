import { ApiProperty } from '@nestjs/swagger';

export class BoardMemberMemberSummaryResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
}
