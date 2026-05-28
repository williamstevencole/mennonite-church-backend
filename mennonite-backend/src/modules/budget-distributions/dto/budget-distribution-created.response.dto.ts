import { ApiProperty } from '@nestjs/swagger';

export class BudgetDistributionCreatedResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;
}
