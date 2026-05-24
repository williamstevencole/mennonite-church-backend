import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { TransactionCategoryType } from '../transaction-category-type.enum';

export class CreateTransactionCategoryDto {
  @ApiProperty({ example: 'Diezmos', maxLength: 80 })
  @IsString()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiProperty({
    enum: TransactionCategoryType,
    example: TransactionCategoryType.Income,
  })
  @IsEnum(TransactionCategoryType)
  type!: TransactionCategoryType;
}
