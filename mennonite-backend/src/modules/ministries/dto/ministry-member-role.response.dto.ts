import { ApiProperty } from '@nestjs/swagger';

export class MinistryMemberRoleResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
}
