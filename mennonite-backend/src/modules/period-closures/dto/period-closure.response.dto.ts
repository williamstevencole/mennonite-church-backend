import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PeriodClosureResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 2025 })
  year!: number;

  @ApiProperty({ example: 80930 })
  ownFunds!: number;

  @ApiProperty({ example: 500000 })
  accumulatedReserve!: number;

  @ApiProperty({
    example: 580930,
    description: 'ownFunds + accumulatedReserve',
  })
  total!: number;

  @ApiProperty({
    example: 45000,
    description:
      'Resultado neto del año calculado en vivo desde financial_transaction',
  })
  netResult!: number;

  @ApiPropertyOptional({ example: '2025-12-31', nullable: true })
  closureDate!: string | null;

  @ApiPropertyOptional({
    example: 'Cierre aprobado en asamblea',
    nullable: true,
  })
  notes!: string | null;

  @ApiPropertyOptional({ example: '2026-01-15T18:30:00.000Z', nullable: true })
  createdAt!: string | null;

  @ApiPropertyOptional({ example: 12, nullable: true })
  createdBy!: number | null;
}
