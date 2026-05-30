import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { MemberRoleTypeResponseDto } from './member-role-type.response.dto';

export class MemberRoleTypesPageResponseDto extends PaginatedResponseDto<MemberRoleTypeResponseDto> {
  @ApiProperty({ type: [MemberRoleTypeResponseDto] })
  declare data: MemberRoleTypeResponseDto[];
}
