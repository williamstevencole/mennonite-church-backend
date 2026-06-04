import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BudgetListItemResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiPropertyOptional({
    example: 'Presupuesto aprobado en asamblea',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 'Draft' })
  status!: string;

  @ApiPropertyOptional({ example: '2026-01-15T18:30:00.000Z', nullable: true })
  createdAt!: string | null;

  @ApiPropertyOptional({ example: 12, nullable: true })
  createdBy!: number | null;
}
