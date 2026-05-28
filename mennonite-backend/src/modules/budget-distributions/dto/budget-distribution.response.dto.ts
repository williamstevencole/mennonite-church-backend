import { ApiProperty } from '@nestjs/swagger';
import { BudgetDistributionMinistryResponseDto } from './budget-distribution-ministry.response.dto';

export class BudgetDistributionResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ type: BudgetDistributionMinistryResponseDto })
  ministry!: BudgetDistributionMinistryResponseDto;

  @ApiProperty({
    example: 25,
    description: 'Porcentaje del presupuesto asignado al ministerio',
  })
  percentage!: number;

  @ApiProperty({
    example: 125000,
    description: 'Monto en Lempiras calculado como porcentaje del total',
  })
  allocatedAmount!: number;
}
