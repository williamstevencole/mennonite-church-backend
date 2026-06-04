import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class ListFundraisingDetailsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 5, description: 'Filtrar por ID de evento' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idEvent?: number;
}
