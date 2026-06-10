import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class FinancialTransactionsSummaryQueryDto {
  @ApiPropertyOptional({
    example: 2026,
    description:
      'Año a resumir. Si se omite, el resumen abarca todos los registros.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(3000)
  year?: number;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Iglesia a consultar. Si se omite, se usa la iglesia del usuario autenticado.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idChurch?: number;
}
