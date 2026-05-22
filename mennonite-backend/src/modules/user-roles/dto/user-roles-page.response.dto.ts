import { ApiProperty } from '@nestjs/swagger';
import { UserRoleResponseDto } from './user-role.response.dto';

export class UserRolesPageResponseDto {
  @ApiProperty({ type: [UserRoleResponseDto] })
  data!: UserRoleResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() size!: number;
}
