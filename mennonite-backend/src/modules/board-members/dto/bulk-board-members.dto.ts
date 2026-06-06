import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

export class BulkBoardMemberAddDto {
  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMember!: number;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idBoardRoleType!: number;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class BulkBoardMemberUpdateDto {
  @ApiProperty({ example: 42, description: 'Id del board_member a actualizar' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idBoardRoleType?: number;

  @ApiPropertyOptional({ example: '2026-02-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31', nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}

export class BulkBoardMembersDto {
  @ApiPropertyOptional({
    type: () => [BulkBoardMemberAddDto],
    description: 'Integrantes a dar de alta',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkBoardMemberAddDto)
  add?: BulkBoardMemberAddDto[];

  @ApiPropertyOptional({
    type: () => [BulkBoardMemberUpdateDto],
    description: 'Integrantes a actualizar (cargo o fechas)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkBoardMemberUpdateDto)
  update?: BulkBoardMemberUpdateDto[];

  @ApiPropertyOptional({
    type: [Number],
    description:
      'Ids de board_member a remover (soft delete: active=false). El backend asume que pertenecen al mismo concilio',
    example: [10, 11],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  remove?: number[];
}
