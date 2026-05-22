import { ApiProperty } from '@nestjs/swagger';

export class MinistryListItemResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() idChurch!: number;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() active!: boolean;
}
