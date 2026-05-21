import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @ApiProperty({ example: 'usuario@iglesia.org' })
  @IsEmail()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  email!: string;

  @ApiProperty({ example: 'MiPassword123!' })
  @IsString()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(8)
  password!: string;
}
