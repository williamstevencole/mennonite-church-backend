import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AssignUserRoleDto {
  @ApiProperty({ example: 1, description: 'Id del rol a asignar' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idRole!: number;
}
