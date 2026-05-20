import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserRoleResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
  @ApiProperty() active!: boolean;
  @ApiProperty({ type: [String], description: 'Codes de permisos asignados' })
  permissions!: string[];
}
