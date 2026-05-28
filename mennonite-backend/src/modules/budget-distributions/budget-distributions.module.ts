import { Module } from '@nestjs/common';
import { BudgetDistributionService } from './budget-distributions.service';
import { BudgetDistributionController } from './budget-distributions.controller';

@Module({
  controllers: [BudgetDistributionController],
  providers: [BudgetDistributionService],
})
export class BudgetDistributionsModule {}
