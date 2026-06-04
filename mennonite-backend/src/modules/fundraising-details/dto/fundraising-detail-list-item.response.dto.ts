import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FundraisingDetailEventDto {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ example: 'Barbacoa anual' })
  title!: string;
}

export class FundraisingDetailListItemResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiPropertyOptional({ example: 5000.0, nullable: true })
  targetAmount!: number | null;

  @ApiPropertyOptional({ example: 'Notas del evento', nullable: true })
  notes!: string | null;

  @ApiProperty({ type: () => FundraisingDetailEventDto })
  event!: FundraisingDetailEventDto;
}
