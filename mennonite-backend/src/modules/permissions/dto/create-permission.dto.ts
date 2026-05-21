import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePermissionDto {
  @ApiProperty({
    example: 'reports.export',
    maxLength: 50,
    description:
      'Codigo en formato recurso.accion (solo minusculas, puntos, guiones)',
  })
  @IsString()
  @Transform(trim)
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9.-]+$/, {
    message:
      'code solo puede contener minusculas, numeros, puntos y guiones medios',
  })
  code!: string;

  @ApiProperty({ maxLength: 150 })
  @IsString()
  @Transform(trim)
  @MinLength(1)
  @MaxLength(150)
  description!: string;
}
