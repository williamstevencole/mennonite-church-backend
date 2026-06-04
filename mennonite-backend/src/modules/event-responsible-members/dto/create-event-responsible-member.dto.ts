import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateEventResponsibleMemberDto {
  @ApiProperty({ example: 1, description: 'Id del evento' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idEvent!: number;

  @ApiProperty({ example: 1, description: 'Id del miembro responsable' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMember!: number;
}
