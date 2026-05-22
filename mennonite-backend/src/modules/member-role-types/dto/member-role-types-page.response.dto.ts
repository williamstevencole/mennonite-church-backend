import { ApiProperty } from '@nestjs/swagger';
import { MemberRoleTypeResponseDto } from './member-role-type.response.dto';

export class MemberRoleTypesPageResponseDto {
  @ApiProperty({ type: [MemberRoleTypeResponseDto] })
  data!: MemberRoleTypeResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() size!: number;
}
