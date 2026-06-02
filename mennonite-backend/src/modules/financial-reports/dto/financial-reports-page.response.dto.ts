import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { FinancialReportResponseDto } from './financial-report.response.dto';

export class FinancialReportsPageResponseDto extends PaginatedResponseDto<FinancialReportResponseDto> {
  @ApiProperty({ type: [FinancialReportResponseDto] })
  data!: FinancialReportResponseDto[];
}
