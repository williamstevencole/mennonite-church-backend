import { ApiProperty } from '@nestjs/swagger';

export class IdResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Identificador del recurso (number autoincrement o uuid)',
  })
  id!: number | string;
}
