import { Module } from '@nestjs/common';
import { BudgetCategoriesController } from './budget-categories.controller';
import { BudgetCategoriesService } from './budget-categories.service';

@Module({
  controllers: [BudgetCategoriesController],
  providers: [BudgetCategoriesService],
})
export class BudgetCategoriesModule {}
