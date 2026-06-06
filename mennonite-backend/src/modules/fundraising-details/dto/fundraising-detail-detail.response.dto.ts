import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FundraisingDetailEventDto,
  FundraisingDetailResponsibleDto,
} from './fundraising-detail-list-item.response.dto';

export class FundraisingDetailDetailResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiPropertyOptional({ example: 5000.0, nullable: true })
  targetAmount!: number | null;

  @ApiPropertyOptional({ example: 'Notas del evento', nullable: true })
  notes!: string | null;

  @ApiProperty({ type: () => FundraisingDetailEventDto })
  event!: FundraisingDetailEventDto;

  @ApiProperty({
    type: () => [FundraisingDetailResponsibleDto],
    description: 'Miembros responsables del evento',
  })
  responsibles!: FundraisingDetailResponsibleDto[];

  @ApiProperty({
    example: 6200,
    description:
      'Suma de financial_transaction tipo income asociadas al evento',
  })
  actualIncome!: number;

  @ApiProperty({
    example: 3800,
    description:
      'Suma de financial_transaction tipo expense asociadas al evento',
  })
  actualExpense!: number;

  @ApiProperty({
    example: 2400,
    description: 'actualIncome - actualExpense',
  })
  profit!: number;
}
