import { ApiProperty } from '@nestjs/swagger';

class MyMinistryRoleDto {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ example: 'Líder' })
  name!: string;
}

class MyMinistryMinistryDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'Alabanza y Adoración' })
  name!: string;

  @ApiProperty({ example: true })
  active!: boolean;
}

export class MyMinistryDto {
  @ApiProperty({ type: MyMinistryMinistryDto })
  ministry!: MyMinistryMinistryDto;

  @ApiProperty({ type: MyMinistryRoleDto })
  role!: MyMinistryRoleDto;

  @ApiProperty({ example: '2025-03-12T14:00:00.000Z' })
  joinedAt!: string;
}
