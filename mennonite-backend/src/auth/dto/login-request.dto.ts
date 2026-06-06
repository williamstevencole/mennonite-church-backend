import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: 'oscar.martinez@imcsp.org' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Pastor12345!' })
  @IsString()
  @MinLength(8)
  password!: string;
}
