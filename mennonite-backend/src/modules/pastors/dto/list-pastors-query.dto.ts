import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListPastorsQueryDto {
  @ApiPropertyOptional({
    example: 'Pastor',
    description: 'Filtrar por Pastor o Co-pastor',
  })
  @IsOptional()
  @IsString()
  role?: string;
}
