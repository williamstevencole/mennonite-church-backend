import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, ReceiptType } from './create-financial-transaction.dto';
import { TransactionCategoryType } from '../../transaction-categories/transaction-category-type.enum';

export class FinancialTransactionResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  idChurch!: number;

  @ApiProperty({ example: 1 })
  idCategory!: number;

  @ApiPropertyOptional({ enum: TransactionCategoryType })
  categoryType?: TransactionCategoryType;

  @ApiProperty({ example: 1500.5 })
  amount!: number;

  @ApiProperty({ example: 'Ofrenda dominical' })
  description!: string;

  @ApiProperty({ example: '2026-05-26', type: String, format: 'date' })
  transactionDate!: string;

  @ApiPropertyOptional({ enum: PaymentMethod, nullable: true })
  paymentMethod!: PaymentMethod | null;

  @ApiPropertyOptional({ enum: ReceiptType, nullable: true })
  receiptType!: ReceiptType | null;

  @ApiPropertyOptional({ nullable: true })
  receiptNumber!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiPropertyOptional({ nullable: true })
  idEvent!: number | null;

  @ApiPropertyOptional({ nullable: true })
  idMinistry!: number | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  createdAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  createdBy!: number | null;
}
