import { ApiProperty } from '@nestjs/swagger';
import { TransactionCategoryType } from '../transaction-category-type.enum';

export class TransactionCategoryResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Diezmos' })
  name!: string;

  @ApiProperty({ enum: TransactionCategoryType })
  type!: TransactionCategoryType;

  @ApiProperty({ example: true })
  active!: boolean;
}
