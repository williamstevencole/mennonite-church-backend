import { Module } from '@nestjs/common';
import { BudgetDistributionsController } from './budget-distributions.controller';
import { BudgetDistributionsService } from './budget-distributions.service';

@Module({
  controllers: [BudgetDistributionsController],
  providers: [BudgetDistributionsService],
  exports: [BudgetDistributionsService],
})
export class BudgetDistributionsModule {}
