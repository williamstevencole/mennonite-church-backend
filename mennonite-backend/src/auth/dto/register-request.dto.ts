import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterRequestDto {
  @ApiProperty({ example: 'nuevo.usuario@imcsp.org' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'MiPassword123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 1, description: 'ID de la iglesia' })
  @IsInt()
  @IsPositive()
  idChurch!: number;

  @ApiProperty({ example: 2, description: 'ID del rol asignado' })
  @IsInt()
  @IsPositive()
  idUserRole!: number;

  @ApiProperty({
    example: 5,
    description: 'ID del miembro asociado (obligatorio)',
  })
  @IsInt()
  @IsPositive()
  idMember!: number;
}
