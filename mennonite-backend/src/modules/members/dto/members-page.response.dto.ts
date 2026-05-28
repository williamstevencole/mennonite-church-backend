import { ApiProperty } from '@nestjs/swagger';
import { MemberListItemResponseDto } from './member-list-item.response.dto';

export class MembersPageResponseDto {
  @ApiProperty({ type: [MemberListItemResponseDto] })
  data!: MemberListItemResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() size!: number;
}
