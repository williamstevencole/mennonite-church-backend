import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCityDto {
  @ApiProperty({ example: 'San Pedro Sula', maxLength: 100 })
  @IsString()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 1, description: 'id del departamento' })
  @IsInt()
  idDepartment!: number;
}
