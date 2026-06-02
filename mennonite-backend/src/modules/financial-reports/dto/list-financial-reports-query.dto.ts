import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import { FinancialReportStatus } from './update-financial-report.dto';

export class ListFinancialReportsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por ministerio' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMinistry?: number;

  @ApiPropertyOptional({ description: 'Año del periodo (periodStart)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ enum: FinancialReportStatus })
  @IsOptional()
  @IsEnum(FinancialReportStatus)
  status?: FinancialReportStatus;
}
