import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { UserListItemResponseDto } from './user-list-item.response.dto';

export class UsersPageResponseDto extends PaginatedResponseDto<UserListItemResponseDto> {
  @ApiProperty({ type: [UserListItemResponseDto] })
  declare data: UserListItemResponseDto[];
}
