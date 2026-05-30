import { ApiProperty } from '@nestjs/swagger';

export class BoardRoleTypeResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  idBoard!: number;

  @ApiProperty({ example: 'Presidente' })
  name!: string;

  @ApiProperty({ example: true })
  active!: boolean;
}
