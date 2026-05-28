import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

import { Transform } from 'class-transformer';

export class FindBudgetDistributionsQueryDto {
  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  budgetId!: number;
}
