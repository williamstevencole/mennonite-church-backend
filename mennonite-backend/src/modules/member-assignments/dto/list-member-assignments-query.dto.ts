import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import { MemberAssignmentType } from '../member-assignment-type.enum';

const trimToUndefined = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || undefined : value;

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return value;
};

export class ListMemberAssignmentsQueryDto extends PaginationQueryDto {
  @ApiProperty({
    enum: MemberAssignmentType,
    description: 'Tipo de asignacion (board | ministry). Requerido.',
  })
  @IsEnum(MemberAssignmentType)
  type!: MemberAssignmentType;

  @ApiPropertyOptional({ description: 'Filtra por estado activo' })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  active?: boolean;

  @ApiPropertyOptional({ description: 'Filtra por miembro' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  memberId?: number;

  @ApiPropertyOptional({ description: 'Filtra por concilio' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  boardId?: number;

  @ApiPropertyOptional({ description: 'Filtra por ministerio' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ministryId?: number;

  @ApiPropertyOptional({
    description: 'Filtra por rol (id o nombre del rol)',
  })
  @IsOptional()
  @IsString()
  @Transform(trimToUndefined)
  role?: string;
}
