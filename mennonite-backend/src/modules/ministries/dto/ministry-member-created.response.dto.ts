import { ApiProperty } from '@nestjs/swagger';

export class MinistryMemberCreatedResponseDto {
  @ApiProperty() id!: number;
}
