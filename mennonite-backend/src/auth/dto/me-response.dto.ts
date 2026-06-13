import { ApiProperty } from '@nestjs/swagger';

class MeRoleDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Administrador' })
  name!: string;
}

export class MeMemberDto {
  @ApiProperty({ example: 42 })
  id!: number;

  @ApiProperty({ example: true })
  isBoardMember!: boolean;

  @ApiProperty({ type: [Number], example: [1, 3] })
  ministryLeaderships!: number[];

  @ApiProperty({ type: [Number], example: [1, 3, 7] })
  ministryMemberships!: number[];
}

export class MeResponseDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'usuario@iglesia.org' })
  email!: string;

  @ApiProperty({ example: 'Oscar Martinez', required: false })
  name?: string;

  @ApiProperty({ type: MeRoleDto })
  role!: MeRoleDto;

  @ApiProperty({ type: [String], example: ['users.read', 'events.write'] })
  permissions!: string[];

  @ApiProperty({ enum: ['admin', 'lider', 'miembro'], example: 'lider' })
  area!: 'admin' | 'lider' | 'miembro';

  @ApiProperty({ type: MeMemberDto, nullable: true })
  member!: MeMemberDto | null;
}
