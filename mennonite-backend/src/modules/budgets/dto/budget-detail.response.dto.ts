import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BudgetTotalsDto {
  @ApiProperty({
    example: 500000,
    description: 'Suma de annualAmount de categorias tipo income',
  })
  totalIncome!: number;

  @ApiProperty({
    example: 450000,
    description: 'Suma de annualAmount de categorias tipo expense',
  })
  totalExpenses!: number;

  @ApiProperty({
    example: 3,
    description: 'Cantidad de distribuciones asignadas',
  })
  distributionCount!: number;
}

export class BudgetDetailResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiPropertyOptional({
    example: 'Presupuesto aprobado en asamblea',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    example: 1770000,
    description: 'Total ingresos planificado en Lempiras',
  })
  expectedIncome!: number;

  @ApiProperty({
    example: 1650000,
    description: 'Total egresos planificado en Lempiras',
  })
  expectedExpense!: number;

  @ApiProperty({ example: 'Draft' })
  status!: string;

  @ApiPropertyOptional({ example: '2026-01-15T18:30:00.000Z', nullable: true })
  createdAt!: string | null;

  @ApiPropertyOptional({ example: 12, nullable: true })
  createdBy!: number | null;

  @ApiProperty({ type: BudgetTotalsDto })
  totals!: BudgetTotalsDto;
}
