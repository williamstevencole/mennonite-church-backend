import { ApiProperty } from '@nestjs/swagger';

export class BoardCreatedResponseDto {
  @ApiProperty() id!: number;
}
