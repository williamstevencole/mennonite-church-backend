import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetCategoryCategoryResponseDto } from './budget-category-category.response.dto';

export class BudgetCategoryResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  budgetId!: number;

  @ApiProperty({ type: BudgetCategoryCategoryResponseDto })
  category!: BudgetCategoryCategoryResponseDto;

  @ApiProperty({ example: 120000 })
  annualAmount!: number;

  @ApiProperty({
    example: 7.27,
    description:
      'Porcentaje que representa esta categoria dentro de su bucket (income o expense) del mismo presupuesto',
  })
  percentageOfBucket!: number;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;
}
