import { ApiProperty } from '@nestjs/swagger';

export class MemberAssignmentTargetResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
}
