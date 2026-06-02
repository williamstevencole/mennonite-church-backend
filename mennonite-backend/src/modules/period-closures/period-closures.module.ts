import { Module } from '@nestjs/common';
import { PeriodClosuresController } from './period-closures.controller';
import { PeriodClosuresService } from './period-closures.service';

@Module({
  controllers: [PeriodClosuresController],
  providers: [PeriodClosuresService],
})
export class PeriodClosuresModule {}
