import { ApiProperty } from '@nestjs/swagger';

export class MemberEventMemberSummaryResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
}
