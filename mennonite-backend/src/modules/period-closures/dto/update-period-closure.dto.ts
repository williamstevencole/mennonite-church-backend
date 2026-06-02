import { PartialType } from '@nestjs/swagger';
import { CreatePeriodClosureDto } from './create-period-closure.dto';

export class UpdatePeriodClosureDto extends PartialType(
  CreatePeriodClosureDto,
) {}
