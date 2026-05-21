import { ApiProperty } from '@nestjs/swagger';
import { UserListItemResponseDto } from './user-list-item.response.dto';

export class UsersPageResponseDto {
  @ApiProperty({ type: [UserListItemResponseDto] })
  data!: UserListItemResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() size!: number;
}
