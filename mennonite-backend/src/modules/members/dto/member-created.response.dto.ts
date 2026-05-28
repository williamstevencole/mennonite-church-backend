import { ApiProperty } from '@nestjs/swagger';

export class MemberCreatedResponseDto {
  @ApiProperty() id!: number;
}
