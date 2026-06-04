import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { CityResponseDto } from './city.response.dto';

export class CitiesPageResponseDto extends PaginatedResponseDto<CityResponseDto> {
  @ApiProperty({ type: [CityResponseDto] })
  declare data: CityResponseDto[];
}
