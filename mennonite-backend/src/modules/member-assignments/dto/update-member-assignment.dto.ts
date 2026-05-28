import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateMemberAssignmentDto {
  @ApiPropertyOptional({ example: 1, description: 'Id del rol del miembro' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_member_role_type?: number;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description:
      'Fecha de cierre de la asignacion. Establece active=false automaticamente.',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
