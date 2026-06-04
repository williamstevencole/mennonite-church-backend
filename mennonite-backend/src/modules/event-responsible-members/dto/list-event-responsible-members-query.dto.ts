import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class ListEventResponsibleMembersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por evento' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idEvent?: number;

  @ApiPropertyOptional({ description: 'Filtra por miembro' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMember?: number;
}
