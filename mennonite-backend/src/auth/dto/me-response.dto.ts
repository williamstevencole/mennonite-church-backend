import { ApiProperty } from '@nestjs/swagger';

class MeRoleDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Administrador' })
  name!: string;
}

export class MeResponseDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'usuario@iglesia.org' })
  email!: string;

  @ApiProperty({ type: MeRoleDto })
  role!: MeRoleDto;

  @ApiProperty({ type: [String], example: ['users.read', 'events.write'] })
  permissions!: string[];
}
