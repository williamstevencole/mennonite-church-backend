import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FundraisingDetailEventDto } from './fundraising-detail-list-item.response.dto';

export class FundraisingDetailDetailResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiPropertyOptional({ example: 5000.0, nullable: true })
  targetAmount!: number | null;

  @ApiPropertyOptional({ example: 'Notas del evento', nullable: true })
  notes!: string | null;

  @ApiProperty({ type: () => FundraisingDetailEventDto })
  event!: FundraisingDetailEventDto;
}
