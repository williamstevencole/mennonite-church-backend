import { ApiProperty } from '@nestjs/swagger';

export class RegisterRequestDto {
  @ApiProperty({ example: 'usuario@iglesia.org' })
  email: string;

  @ApiProperty({ example: 'MiPassword123!' })
  password: string;
}
