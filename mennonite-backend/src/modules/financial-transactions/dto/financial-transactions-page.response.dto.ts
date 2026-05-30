import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { FinancialTransactionResponseDto } from './financial-transaction.response.dto';

export class FinancialTransactionsPageResponseDto extends PaginatedResponseDto<FinancialTransactionResponseDto> {
  @ApiProperty({ type: [FinancialTransactionResponseDto] })
  declare data: FinancialTransactionResponseDto[];
}
