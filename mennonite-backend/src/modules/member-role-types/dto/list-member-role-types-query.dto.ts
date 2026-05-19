import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { MemberRoleBelongsTo } from '../member-role-belongs-to.enum';

export class ListMemberRoleTypesQueryDto {
  @ApiPropertyOptional({
    enum: MemberRoleBelongsTo,
    description: 'Filtra por ambito del cargo (Council o Ministry)',
  })
  @IsOptional()
  @IsEnum(MemberRoleBelongsTo)
  belongsTo?: MemberRoleBelongsTo;
}
