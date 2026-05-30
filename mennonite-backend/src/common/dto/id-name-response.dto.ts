import { ApiProperty } from '@nestjs/swagger';

export class IdNameResponseDto {
  @ApiProperty({ example: 1 })
  id!: number | string;

  @ApiProperty({ example: 'Nombre del recurso' })
  name!: string;
}
