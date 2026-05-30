import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { BoardListItemResponseDto } from './board-list-item.response.dto';

export class BoardsPageResponseDto extends PaginatedResponseDto<BoardListItemResponseDto> {
  @ApiProperty({ type: [BoardListItemResponseDto] })
  declare data: BoardListItemResponseDto[];
}
