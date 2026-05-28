import { PartialType } from '@nestjs/mapped-types';
import { CreateBudgetDistributionDto } from './create-budget-distribution.dto';

export class UpdateBudgetDistributionDto extends PartialType(CreateBudgetDistributionDto) {}
