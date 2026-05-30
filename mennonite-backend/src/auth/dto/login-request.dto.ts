import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: 'admin@mennonite.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Admin12345!' })
  @IsString()
  @MinLength(8)
  password!: string;
}
