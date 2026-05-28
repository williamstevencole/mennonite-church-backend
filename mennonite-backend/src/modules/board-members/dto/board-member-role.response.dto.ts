import { ApiProperty } from '@nestjs/swagger';

export class BoardMemberRoleResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
}
