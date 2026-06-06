import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export type SeriesRange = '3m' | '6m' | '12m';

export class FinancialTransactionsSeriesQueryDto {
  @ApiPropertyOptional({
    enum: ['3m', '6m', '12m'],
    description:
      'Rango móvil contado hacia atrás desde el mes actual. Default: 12m',
    default: '12m',
  })
  @IsOptional()
  @IsEnum(['3m', '6m', '12m'])
  range?: SeriesRange;
}
