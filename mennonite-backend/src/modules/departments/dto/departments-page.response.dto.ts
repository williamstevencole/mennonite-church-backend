import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { DepartmentResponseDto } from './department.response.dto';

export class DepartmentsPageResponseDto extends PaginatedResponseDto<DepartmentResponseDto> {
  @ApiProperty({ type: [DepartmentResponseDto] })
  declare data: DepartmentResponseDto[];
}
