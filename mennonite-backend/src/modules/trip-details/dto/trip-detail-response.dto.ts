import { ApiProperty } from '@nestjs/swagger';

export class TripDetailResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Tegucigalpa' })
  origin!: string;

  @ApiProperty({ example: 'San Pedro Sula' })
  destination!: string;

  @ApiProperty({
    example: 'Salida programada a las 5:00 AM',
    nullable: true,
  })
  notes!: string | null;

  @ApiProperty({
    example: 'Retiro Juvenil 2026',
  })
  eventTitle!: string;
}
