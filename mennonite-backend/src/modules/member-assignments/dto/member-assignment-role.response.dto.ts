import { ApiProperty } from '@nestjs/swagger';

export class MemberAssignmentRoleResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
}
