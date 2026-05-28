import { ApiProperty } from '@nestjs/swagger';

export class MemberAssignmentCreatedResponseDto {
  @ApiProperty() id!: number;
}
