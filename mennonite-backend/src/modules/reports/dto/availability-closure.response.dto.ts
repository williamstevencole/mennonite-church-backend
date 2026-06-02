import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AvailabilityClosureResponseDto {
  @ApiProperty({ example: 2025 })
  year!: number;

  @ApiProperty({ example: 80930 })
  fondosPropios!: number;

  @ApiProperty({ example: 500000 })
  reservaAcumulada!: number;

  @ApiProperty({ example: 580930 })
  total!: number;

  @ApiProperty({ example: 14, description: 'Porcentaje de fondos propios' })
  pctFondos!: number;

  @ApiProperty({ example: 86, description: 'Porcentaje de reserva acumulada' })
  pctReserva!: number;

  @ApiProperty({
    example: 45000,
    description: 'Resultado neto del año calculado desde financial_transaction',
  })
  resultadoNeto!: number;

  @ApiPropertyOptional({ example: '2025-12-31', nullable: true })
  fechaCierre!: string | null;

  @ApiPropertyOptional({
    example: 'Cierre aprobado en asamblea',
    nullable: true,
  })
  notas!: string | null;
}
