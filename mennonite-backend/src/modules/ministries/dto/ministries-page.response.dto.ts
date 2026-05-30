import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { MinistryListItemResponseDto } from './ministry-list-item.response.dto';

export class MinistriesPageResponseDto extends PaginatedResponseDto<MinistryListItemResponseDto> {
  @ApiProperty({ type: [MinistryListItemResponseDto] })
  declare data: MinistryListItemResponseDto[];
}
