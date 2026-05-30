import { ApiProperty } from '@nestjs/swagger';

export class MinistryListItemResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() idChurch!: number;
  @ApiProperty() name!: string;
  @ApiProperty() active!: boolean;
}
