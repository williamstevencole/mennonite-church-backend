import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class ListCitiesQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por id del departamento' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idDepartment?: number;
}
