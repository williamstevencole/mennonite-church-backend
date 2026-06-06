import { ApiProperty } from '@nestjs/swagger';

export class BudgetSummaryResponseDto {
  @ApiProperty({
    example: 1770000,
    description: 'Total ingresos esperado (techo)',
  })
  expectedIncome!: number;

  @ApiProperty({
    example: 1770000,
    description: 'Suma de annualAmount de categorias tipo income',
  })
  plannedIncome!: number;

  @ApiProperty({
    example: 0,
    description: 'expectedIncome - plannedIncome (no puede ser negativo)',
  })
  incomeRemaining!: number;

  @ApiProperty({
    example: 1650000,
    description: 'Total egresos esperado (techo)',
  })
  expectedExpense!: number;

  @ApiProperty({
    example: 1650000,
    description: 'Suma de annualAmount de categorias tipo expense',
  })
  plannedExpense!: number;

  @ApiProperty({
    example: 0,
    description: 'expectedExpense - plannedExpense',
  })
  expenseRemaining!: number;

  @ApiProperty({
    example: 120000,
    description: 'expectedIncome - expectedExpense (resultado planificado)',
  })
  plannedResult!: number;
}
