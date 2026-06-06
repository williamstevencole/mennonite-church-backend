import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FundraisingDetailResponsibleDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'Ana Patricia Díaz' })
  name!: string;
}

export class FundraisingDetailEventDto {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ example: 'Barbacoa anual' })
  title!: string;

  @ApiProperty({
    example: '2026-03-15T18:00:00.000Z',
    description: 'startDatetime del evento',
  })
  startDate!: string;

  @ApiProperty({
    example: 'Completed',
    enum: ['Planned', 'In Progress', 'Completed', 'Cancelled'],
  })
  status!: string;
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
