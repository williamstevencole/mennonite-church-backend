import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class RejectFinancialReportDto {
  @ApiProperty({
    example: 'Faltan dos transacciones del mes de marzo en el detalle',
    description:
      'Razón por la cual se devuelve el reporte al líder del ministerio',
  })
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  observacion!: string;
}
