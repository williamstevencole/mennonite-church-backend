import { ApiProperty } from '@nestjs/swagger';

export class CashflowPointDto {
  @ApiProperty({ example: 'Jun', description: 'Mes abreviado (Ene, Feb, …)' })
  name!: string;

  @ApiProperty({ example: 45000, description: 'Ingresos del mes en lempiras' })
  income!: number;

  @ApiProperty({ example: 32000, description: 'Gastos del mes en lempiras' })
  expense!: number;
}

export class DashboardCashflowResponseDto {
  @ApiProperty({ type: [CashflowPointDto] })
  points!: CashflowPointDto[];
}
