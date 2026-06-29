import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CheckEmailRequestDto {
  @ApiProperty({ example: 'oscar.martinez@imcsp.org' })
  @IsEmail()
  email!: string;
}
