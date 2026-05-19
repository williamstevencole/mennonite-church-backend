import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberRoleBelongsTo } from '../member-role-belongs-to.enum';

export class MemberRoleTypeResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Lider' })
  name!: string;

  @ApiPropertyOptional({ enum: MemberRoleBelongsTo, nullable: true })
  belongsTo!: MemberRoleBelongsTo | null;

  @ApiProperty({ example: true })
  active!: boolean;
}
