import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { PermissionResponseDto } from './permission.response.dto';

export class PermissionsPageResponseDto extends PaginatedResponseDto<PermissionResponseDto> {
  @ApiProperty({ type: [PermissionResponseDto] })
  declare data: PermissionResponseDto[];
}
