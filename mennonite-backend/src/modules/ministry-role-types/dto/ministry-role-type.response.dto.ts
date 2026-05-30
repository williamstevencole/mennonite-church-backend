import { ApiProperty } from '@nestjs/swagger';

export class MinistryRoleTypeResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  idMinistry!: number;

  @ApiProperty({ example: 'Lider' })
  name!: string;

  @ApiProperty({ example: true })
  active!: boolean;
}
