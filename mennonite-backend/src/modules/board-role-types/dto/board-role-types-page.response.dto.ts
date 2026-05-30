import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { BoardRoleTypeResponseDto } from './board-role-type.response.dto';

export class BoardRoleTypesPageResponseDto extends PaginatedResponseDto<BoardRoleTypeResponseDto> {
  @ApiProperty({ type: [BoardRoleTypeResponseDto] })
  declare data: BoardRoleTypeResponseDto[];
}
