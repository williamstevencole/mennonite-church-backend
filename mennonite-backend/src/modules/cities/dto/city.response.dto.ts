import { ApiProperty } from '@nestjs/swagger';

export class CityResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() idDepartment!: number;
}
