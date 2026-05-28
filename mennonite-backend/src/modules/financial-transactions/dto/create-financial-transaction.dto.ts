import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum PaymentMethod {
  Cash = 'Cash',
  Transfer = 'Transfer',
  Check = 'Check',
  Card = 'Card',
}

export enum ReceiptType {
  Receipt = 'Receipt',
  Invoice = 'Invoice',
  Certificate = 'Certificate',
  Note = 'Note',
  Other = 'Other',
}

export class CreateFinancialTransactionDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  idChurch!: number;

  @ApiProperty({
    example: 1,
    description: 'Categoria determina income/expense',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  idCategory!: number;

  @ApiProperty({
    example: 1500.5,
    description: 'Monto positivo, max 2 decimales',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @ApiProperty({ example: 'Ofrenda dominical', maxLength: 200 })
  @IsString()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(200)
  description!: string;

  @ApiProperty({ example: '2026-05-26', description: 'ISO date (YYYY-MM-DD)' })
  @IsDateString()
  transactionDate!: string;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ enum: ReceiptType })
  @IsOptional()
  @IsEnum(ReceiptType)
  receiptType?: ReceiptType;

  @ApiPropertyOptional({ example: 'R-001234', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  receiptNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  idEvent?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'NULL = fondos generales de la iglesia',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  idMinistry?: number;
}
