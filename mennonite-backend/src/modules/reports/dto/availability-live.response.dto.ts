import { ApiProperty } from '@nestjs/swagger';

export class AvailabilityLiveResponseDto {
  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({
    example: 80930,
    description: 'Caja chica + cuenta corriente del último cierre',
  })
  fondosPropios!: number;

  @ApiProperty({
    example: 500000,
    description: 'Reserva acumulada del último cierre',
  })
  reservaAcumulada!: number;

  @ApiProperty({
    example: 45000,
    description: 'Neto del año en curso (ingresos - egresos)',
  })
  deltaAnio!: number;

  @ApiProperty({
    example: 625930,
    description: 'fondosPropios + reservaAcumulada + deltaAnio',
  })
  disponibilidadTotal!: number;

  @ApiProperty({
    example: 2025,
    nullable: true,
    description: 'Año del último cierre considerado, null si no hay cierre',
  })
  baseClosureYear!: number | null;
}
