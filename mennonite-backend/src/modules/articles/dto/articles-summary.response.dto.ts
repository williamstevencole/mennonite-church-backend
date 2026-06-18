import { ApiProperty } from '@nestjs/swagger';

export class ArticlesSummaryResponseDto {
  @ApiProperty({ example: 15, description: 'Cantidad de articulos activos' })
  totalArticles!: number;

  @ApiProperty({
    example: 12500.5,
    description:
      'Valor total del inventario = suma de (unitCost x saldo) sobre articulos activos',
  })
  totalValue!: number;

  @ApiProperty({
    example: 230,
    description: 'Total de movimientos registrados para la iglesia',
  })
  totalMovements!: number;
}
