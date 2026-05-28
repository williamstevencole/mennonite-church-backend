import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class FindBudgetDistributionsQueryDto {
  @ApiProperty({
    example: 1,
    description: 'Id del presupuesto cuyas distribuciones se listan',
  })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  budgetId!: number;
}
