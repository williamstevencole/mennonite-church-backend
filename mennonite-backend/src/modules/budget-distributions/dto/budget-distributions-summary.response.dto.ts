import { ApiProperty } from '@nestjs/swagger';

export class BudgetDistributionsSummaryResponseDto {
  @ApiProperty({
    example: 250000,
    description: 'annualAmount de la categoria "Ministerios" expense (techo)',
  })
  targetAmount!: number;

  @ApiProperty({
    example: 250000,
    description: 'Suma de annualAmount de las distribuciones del budget',
  })
  total!: number;

  @ApiProperty({ example: 0, description: 'targetAmount - total' })
  remaining!: number;

  @ApiProperty({ example: true })
  isComplete!: boolean;
}
