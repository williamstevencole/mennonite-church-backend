import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserRoleResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
  @ApiProperty() active!: boolean;
  @ApiProperty({
    description:
      'Rol del sistema. No se puede renombrar ni eliminar; controla el área de UI del usuario.',
  })
  isSystem!: boolean;
  @ApiProperty({ type: [String], description: 'Codes de permisos asignados' })
  permissions!: string[];
}
