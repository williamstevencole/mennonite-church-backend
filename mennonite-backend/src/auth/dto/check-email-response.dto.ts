import { ApiProperty } from '@nestjs/swagger';

export class CheckEmailResponseDto {
  @ApiProperty({
    description: 'Indica si existe un usuario activo con ese correo',
    example: true,
  })
  exists!: boolean;
}
