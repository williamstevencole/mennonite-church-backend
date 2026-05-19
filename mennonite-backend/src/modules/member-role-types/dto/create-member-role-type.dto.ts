import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MemberRoleBelongsTo } from '../member-role-belongs-to.enum';

export class CreateMemberRoleTypeDto {
  @ApiProperty({ example: 'Lider', maxLength: 80 })
  @IsString()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({
    enum: MemberRoleBelongsTo,
    example: MemberRoleBelongsTo.Ministry,
  })
  @IsOptional()
  @IsEnum(MemberRoleBelongsTo)
  belongsTo?: MemberRoleBelongsTo;
}
