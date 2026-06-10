import { ApiProperty } from '@nestjs/swagger';

export class MinistrySummaryDto {
  @ApiProperty({ example: 4 })
  idMinistry!: number;

  @ApiProperty({ example: 'Jóvenes' })
  ministryName!: string;

  @ApiProperty({ example: 12500 })
  income!: number;

  @ApiProperty({ example: 8000 })
  expense!: number;

  @ApiProperty({ example: 4500, description: 'income - expense' })
  net!: number;

  @ApiProperty({ example: 18 })
  count!: number;
}

export class CategorySummaryDto {
  @ApiProperty({ example: 2 })
  idCategory!: number;

  @ApiProperty({ example: 'Diezmos' })
  categoryName!: string;

  @ApiProperty({ example: 45000 })
  amount!: number;
}

export class FinancialTransactionsSummaryResponseDto {
  @ApiProperty({
    example: 2026,
    nullable: true,
    description: 'Año del resumen. null si abarca todos los registros.',
  })
  year!: number | null;

  @ApiProperty({ example: 1 })
  idChurch!: number;

  @ApiProperty({ example: 320000 })
  totalIncome!: number;

  @ApiProperty({ example: 245000 })
  totalExpense!: number;

  @ApiProperty({ example: 75000, description: 'totalIncome - totalExpense' })
  totalNet!: number;

  @ApiProperty({
    example: 250000,
    description: 'Suma de ingresos sin ministerio asociado (caja general).',
  })
  generalIncome!: number;

  @ApiProperty({
    example: 180000,
    description: 'Suma de gastos sin ministerio asociado (caja general).',
  })
  generalExpense!: number;

  @ApiProperty({ example: 70000 })
  generalNet!: number;

  @ApiProperty({
    example: 70000,
    description: 'Suma de ingresos atribuidos a algún ministerio.',
  })
  ministryIncome!: number;

  @ApiProperty({
    example: 65000,
    description: 'Suma de gastos atribuidos a algún ministerio.',
  })
  ministryExpense!: number;

  @ApiProperty({ example: 5000 })
  ministryNet!: number;

  @ApiProperty({
    example: 184,
    description: 'Cantidad total de transacciones.',
  })
  totalCount!: number;

  @ApiProperty({
    example: 92,
    description: 'Cantidad de transacciones de ingreso.',
  })
  incomeCount!: number;

  @ApiProperty({
    example: 92,
    description: 'Cantidad de transacciones de gasto.',
  })
  expenseCount!: number;

  @ApiProperty({
    type: () => [MinistrySummaryDto],
    description:
      'Resumen por ministerio. Solo ministerios con al menos una transacción en el período.',
  })
  byMinistry!: MinistrySummaryDto[];

  @ApiProperty({
    type: () => [CategorySummaryDto],
    description: 'Top 3 categorías de ingresos por monto.',
  })
  topIncome!: CategorySummaryDto[];

  @ApiProperty({
    type: () => [CategorySummaryDto],
    description: 'Top 3 categorías de gastos por monto.',
  })
  topExpense!: CategorySummaryDto[];
}
