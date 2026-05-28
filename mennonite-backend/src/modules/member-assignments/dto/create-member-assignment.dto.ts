import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { MemberAssignmentType } from '../member-assignment-type.enum';

export class CreateMemberAssignmentDto {
  @ApiProperty({
    enum: MemberAssignmentType,
    description: 'Tipo de asignacion (board | ministry)',
  })
  @IsEnum(MemberAssignmentType)
  assignment_type!: MemberAssignmentType;

  @ApiProperty({ example: 1, description: 'Id del miembro' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_member!: number;

  @ApiPropertyOptional({ example: 1, description: 'Id del concilio' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_board?: number;

  @ApiPropertyOptional({ example: 1, description: 'Id del ministerio' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_ministry?: number;

  @ApiProperty({ example: 1, description: 'Id del rol del miembro' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_member_role_type!: number;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  start_date!: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
