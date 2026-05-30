import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { UserRoleResponseDto } from './user-role.response.dto';

export class UserRolesPageResponseDto extends PaginatedResponseDto<UserRoleResponseDto> {
  @ApiProperty({ type: [UserRoleResponseDto] })
  declare data: UserRoleResponseDto[];
}
