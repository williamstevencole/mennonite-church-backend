import { ApiProperty } from '@nestjs/swagger';

export class MonthlySeriesPointDto {
  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: 3, description: '1-12' })
  month!: number;

  @ApiProperty({ example: 'mar-2026' })
  label!: string;

  @ApiProperty({ example: 87000 })
  income!: number;

  @ApiProperty({ example: 60000 })
  expense!: number;

  @ApiProperty({ example: 27000, description: 'income - expense' })
  net!: number;
}

export class FinancialTransactionsSeriesResponseDto {
  @ApiProperty({ enum: ['3m', '6m', '12m'] })
  range!: '3m' | '6m' | '12m';

  @ApiProperty({
    type: () => [MonthlySeriesPointDto],
    description: 'Puntos ordenados cronológicamente (ascendente)',
  })
  data!: MonthlySeriesPointDto[];
}
