import { ApiProperty } from '@nestjs/swagger';
import { BudgetDistributionMinistryResponseDto } from './budget-distribution-ministry.response.dto';

export class BudgetDistributionResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ type: BudgetDistributionMinistryResponseDto })
  ministry!: BudgetDistributionMinistryResponseDto;

  @ApiProperty({
    example: 62500,
    description: 'Monto anual asignado al ministerio en Lempiras',
  })
  annualAmount!: number;

  @ApiProperty({
    example: 25,
    description:
      'Porcentaje que representa este monto sobre el total de la categoría Ministerios',
  })
  percentageOfMinisteriosBudget!: number;
}
