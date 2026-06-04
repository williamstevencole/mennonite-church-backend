import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class MembersBirthdaysQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 6,
    description: 'Mes (1-12). Si no se envía, se usa el mes actual',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
