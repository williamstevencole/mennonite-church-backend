import { ApiProperty } from '@nestjs/swagger';

export class ResultsSummaryRowDto {
  @ApiProperty({ example: 'Diezmos y Ofrendas' })
  categoria!: string;

  @ApiProperty({
    enum: ['income', 'expense', 'total_income', 'total_expense', 'net_result'],
    example: 'income',
  })
  tipo!: 'income' | 'expense' | 'total_income' | 'total_expense' | 'net_result';

  @ApiProperty({ example: 87000, description: 'Real del año' })
  montoAnio!: number;

  @ApiProperty({ example: 80000, description: 'Real del año anterior' })
  montoAnioAnterior!: number;

  @ApiProperty({ example: 7000, description: 'montoAnio - montoAnioAnterior' })
  variacion!: number;

  @ApiProperty({
    example: 8.75,
    description: 'Variación % vs año anterior (0 si anterior=0)',
  })
  variacionPct!: number;

  @ApiProperty({ example: 90000, description: 'Monto presupuestado del año' })
  montoPresupuesto!: number;

  @ApiProperty({
    example: -3000,
    description: 'montoAnio - montoPresupuesto',
  })
  variacionPresup!: number;

  @ApiProperty({
    example: -3.33,
    description: 'Variación % vs presupuesto (0 si presupuesto=0)',
  })
  variacionPresupPct!: number;
}

export class ResultsSummaryResponseDto {
  @ApiProperty({ example: 2025 })
  year!: number;

  @ApiProperty({ type: [ResultsSummaryRowDto] })
  rows!: ResultsSummaryRowDto[];
}
