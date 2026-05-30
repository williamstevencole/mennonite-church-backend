import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { MinistryRoleTypeResponseDto } from './ministry-role-type.response.dto';

export class MinistryRoleTypesPageResponseDto extends PaginatedResponseDto<MinistryRoleTypeResponseDto> {
  @ApiProperty({ type: [MinistryRoleTypeResponseDto] })
  declare data: MinistryRoleTypeResponseDto[];
}
