import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class ListCitiesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por id del departamento' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idDepartment?: number;
}
