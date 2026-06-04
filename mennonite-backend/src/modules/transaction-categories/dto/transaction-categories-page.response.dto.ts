import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { TransactionCategoryResponseDto } from './transaction-category.response.dto';

export class TransactionCategoriesPageResponseDto extends PaginatedResponseDto<TransactionCategoryResponseDto> {
  @ApiProperty({ type: [TransactionCategoryResponseDto] })
  declare data: TransactionCategoryResponseDto[];
}
