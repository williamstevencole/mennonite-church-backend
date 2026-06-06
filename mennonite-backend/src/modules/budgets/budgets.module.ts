import { Module } from '@nestjs/common';
import { BudgetCategoriesModule } from '../budget-categories/budget-categories.module';
import { BudgetDistributionsModule } from '../budget-distributions/budget-distributions.module';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';

@Module({
  imports: [BudgetCategoriesModule, BudgetDistributionsModule],
  controllers: [BudgetsController],
  providers: [BudgetsService],
})
export class BudgetsModule {}
