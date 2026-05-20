import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsInt } from 'class-validator';

export class SetUserRolePermissionsDto {
  @ApiProperty({
    type: [Number],
    description: 'Lista completa de ids de permisos del rol (reemplaza)',
  })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  permissionIds!: number[];
}
