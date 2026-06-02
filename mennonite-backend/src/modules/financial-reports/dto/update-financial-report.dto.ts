import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateFinancialReportDto } from './create-financial-report.dto';

export enum FinancialReportStatus {
  DRAFT = 'Draft',
  PRESENTED = 'Presented',
  APPROVED = 'Approved',
}

export class UpdateFinancialReportDto extends PartialType(
  CreateFinancialReportDto,
) {
  @ApiPropertyOptional({
    enum: FinancialReportStatus,
    description:
      'Transición de estado. Reglas: Draft→Presented→Approved. Approved es inmutable.',
  })
  @IsOptional()
  @IsEnum(FinancialReportStatus)
  status?: FinancialReportStatus;
}
