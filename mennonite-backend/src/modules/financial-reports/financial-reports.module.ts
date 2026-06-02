import { Module } from '@nestjs/common';
import { FinancialReportsController } from './financial-reports.controller';
import { FinancialReportsService } from './financial-reports.service';

@Module({
  controllers: [FinancialReportsController],
  providers: [FinancialReportsService],
})
export class FinancialReportsModule {}
