import { ApiProperty } from '@nestjs/swagger';

export class BoardMemberCreatedResponseDto {
  @ApiProperty() id!: number;
}
