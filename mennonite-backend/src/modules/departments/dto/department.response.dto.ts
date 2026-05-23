import { ApiProperty } from '@nestjs/swagger';

export class DepartmentResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
}
