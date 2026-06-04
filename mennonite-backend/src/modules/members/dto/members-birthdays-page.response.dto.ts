import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { MemberBirthdayItemResponseDto } from './member-birthday-item.response.dto';
export class MembersBirthdaysPageResponseDto extends PaginatedResponseDto<MemberBirthdayItemResponseDto> {
  @ApiProperty({ type: [MemberBirthdayItemResponseDto] })
  declare data: MemberBirthdayItemResponseDto[];
}
