import { ApiProperty } from '@nestjs/swagger';

export class MemberAssignmentMemberSummaryResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
}
