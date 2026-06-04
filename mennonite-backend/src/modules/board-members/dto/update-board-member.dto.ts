import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateBoardMemberDto {
  @ApiPropertyOptional({ example: 1, description: 'Id del rol del concilio' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idBoardRoleType?: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    nullable: true,
    description:
      'Enviar null para limpiar la fecha (miembro vuelve a "en funciones")',
  })
  @ValidateIf((o: UpdateBoardMemberDto) => o.endDate !== null)
  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}
