import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import { MemberRoleBelongsTo } from '../member-role-belongs-to.enum';

export class ListMemberRoleTypesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: MemberRoleBelongsTo,
    description: 'Filtra por ambito del cargo (Council o Ministry)',
  })
  @IsOptional()
  @IsEnum(MemberRoleBelongsTo)
  belongsTo?: MemberRoleBelongsTo;
}
