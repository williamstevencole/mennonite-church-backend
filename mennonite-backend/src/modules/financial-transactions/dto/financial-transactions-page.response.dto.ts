import { ApiProperty } from '@nestjs/swagger';
import { FinancialTransactionResponseDto } from './financial-transaction.response.dto';

export class FinancialTransactionsPageResponseDto {
  @ApiProperty({ type: [FinancialTransactionResponseDto] })
  data!: FinancialTransactionResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() size!: number;
}
