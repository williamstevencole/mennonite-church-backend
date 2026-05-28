import { ApiProperty } from '@nestjs/swagger';

export class BudgetDistributionMinistryResponseDto {
  @ApiProperty({ example: 3 })
  id!: number;

  @ApiProperty({ example: 'Jóvenes' })
  name!: string;
}
