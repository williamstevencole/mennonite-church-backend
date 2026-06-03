import { ApiProperty } from '@nestjs/swagger';
import { TransactionCategoryType } from '../../transaction-categories/transaction-category-type.enum';

export class BudgetCategoryCategoryResponseDto {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ example: 'Diezmos' })
  name!: string;

  @ApiProperty({ enum: TransactionCategoryType })
  type!: TransactionCategoryType;
}
