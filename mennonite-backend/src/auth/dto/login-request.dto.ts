import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({ example: 'admin@mennonite.local' })
  email: string;

  @ApiProperty({ example: 'Admin12345!' })
  password: string;
}
