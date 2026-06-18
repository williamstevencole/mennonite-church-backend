import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRoleResponseDto } from '../../user-roles/dto/user-role.response.dto';

export class UserDetailResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() email!: string;
  @ApiPropertyOptional({ nullable: true })
  name!: string | null;
  @ApiProperty() active!: boolean;
  @ApiPropertyOptional({ type: UserRoleResponseDto, nullable: true })
  role!: UserRoleResponseDto | null;
  @ApiPropertyOptional({ nullable: true })
  idMember!: number | null;
}
