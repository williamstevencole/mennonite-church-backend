import { ApiProperty } from '@nestjs/swagger';
import { PermissionResponseDto } from './permission.response.dto';

export class PermissionsPageResponseDto {
  @ApiProperty({ type: [PermissionResponseDto] })
  data!: PermissionResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() size!: number;
}
