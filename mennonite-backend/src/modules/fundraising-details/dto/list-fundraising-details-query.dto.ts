import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class ListFundraisingDetailsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 5, description: 'Filtrar por ID de evento' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idEvent?: number;

  @ApiPropertyOptional({
    enum: ['date_desc', 'date_asc'],
    description: 'Ordenar por fecha del evento. Default: date_desc',
  })
  @IsOptional()
  @IsEnum(['date_desc', 'date_asc'])
  orderBy?: 'date_desc' | 'date_asc';
}
