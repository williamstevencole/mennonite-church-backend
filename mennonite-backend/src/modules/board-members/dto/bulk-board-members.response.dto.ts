import { ApiProperty } from '@nestjs/swagger';

export class BulkBoardMembersResponseDto {
  @ApiProperty({ example: 3, description: 'Integrantes dados de alta' })
  added!: number;

  @ApiProperty({ example: 2, description: 'Integrantes actualizados' })
  updated!: number;

  @ApiProperty({
    example: 1,
    description: 'Integrantes removidos (soft delete)',
  })
  removed!: number;
}
