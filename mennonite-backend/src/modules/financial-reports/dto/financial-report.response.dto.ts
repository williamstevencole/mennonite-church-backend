import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FinancialReportMinistrySummaryDto {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ example: 'Ministerio de Jóvenes' })
  name!: string;
}

export class FinancialReportResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ nullable: true, type: FinancialReportMinistrySummaryDto })
  ministry!: FinancialReportMinistrySummaryDto | null;

  @ApiProperty({ example: 'annual' })
  reportType!: string;

  @ApiProperty({ example: '2026-01-01' })
  periodStart!: string;

  @ApiProperty({ example: '2026-12-31' })
  periodEnd!: string;

  @ApiProperty({ example: 'Reporte Anual 2026 - Ministerio de Jóvenes' })
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  summary!: string | null;

  @ApiProperty({ example: 12000 })
  totalIncome!: number;

  @ApiProperty({ example: 8000 })
  totalExpenses!: number;

  @ApiProperty({ example: 4000 })
  netResult!: number;

  @ApiProperty({ enum: ['Draft', 'Presented', 'Approved'] })
  status!: string;

  @ApiPropertyOptional({ nullable: true })
  presentedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  approvedAt!: string | null;

  @ApiPropertyOptional({
    example: 'Faltan dos transacciones del mes de marzo en el detalle',
    description: 'Observación del concilio al devolver el reporte',
    nullable: true,
  })
  observacion!: string | null;

  @ApiPropertyOptional({ nullable: true })
  createdAt!: string | null;
}
