import { ApiProperty } from '@nestjs/swagger';

export class MinistryCreatedResponseDto {
  @ApiProperty()
  id!: number;
}