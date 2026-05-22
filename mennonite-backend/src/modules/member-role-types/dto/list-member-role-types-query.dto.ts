import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { MemberRoleBelongsTo } from '../member-role-belongs-to.enum';

export class ListMemberRoleTypesQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number;

  @ApiPropertyOptional({
    enum: MemberRoleBelongsTo,
    description: 'Filtra por ambito del cargo (Council o Ministry)',
  })
  @IsOptional()
  @IsEnum(MemberRoleBelongsTo)
  belongsTo?: MemberRoleBelongsTo;
}
