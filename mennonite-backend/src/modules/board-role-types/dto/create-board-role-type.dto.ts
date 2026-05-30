import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateBoardRoleTypeDto {
  @ApiProperty({ example: 1, description: 'Id del concilio dueño del cargo' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idBoard!: number;

  @ApiProperty({ example: 'Presidente', maxLength: 80 })
  @IsString()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(80)
  name!: string;
}
