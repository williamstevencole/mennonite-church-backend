import { ApiProperty } from '@nestjs/swagger';

export class ArticleBalanceResponseDto {
  @ApiProperty({ example: 7, description: 'Id del artículo' })
  idArticle!: number;

  @ApiProperty({
    example: 12.5,
    description:
      'Saldo actual = suma de movimientos Inbound - suma de movimientos Outbound',
  })
  balance!: number;

  @ApiProperty({
    example: 45.0,
    description: 'Suma de cantidades de movimientos tipo Inbound',
  })
  totalInbound!: number;

  @ApiProperty({
    example: 32.5,
    description: 'Suma de cantidades de movimientos tipo Outbound',
  })
  totalOutbound!: number;
}
