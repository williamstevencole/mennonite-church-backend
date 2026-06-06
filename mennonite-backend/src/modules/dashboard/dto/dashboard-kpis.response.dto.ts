import { ApiProperty } from '@nestjs/swagger';

export class DashboardKpisResponseDto {
  @ApiProperty({
    example: 234,
    description: 'Cantidad de miembros activos de la iglesia',
  })
  membersActive!: number;

  @ApiProperty({
    example: 625930,
    description:
      'Disponibilidad total en vivo: fondosPropios + reservaAcumulada + deltaAnio del año en curso',
  })
  currentBalance!: number;

  @ApiProperty({
    example: 87,
    description: 'Cantidad de artículos activos en el inventario',
  })
  inventoryItems!: number;

  @ApiProperty({
    example: 12,
    description: 'Cantidad de ministerios activos',
  })
  ministriesActive!: number;
}
