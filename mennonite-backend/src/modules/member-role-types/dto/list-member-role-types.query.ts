import { IsEnum, IsOptional } from 'class-validator';
import { MemberRoleBelongsTo } from '../member-role-belongs-to.enum';

export class ListMemberRoleTypesQueryDto {
  @IsOptional()
  @IsEnum(MemberRoleBelongsTo)
  belongsTo?: MemberRoleBelongsTo;
}
