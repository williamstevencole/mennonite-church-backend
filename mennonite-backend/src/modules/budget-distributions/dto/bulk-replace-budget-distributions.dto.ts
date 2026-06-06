import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';

export class BulkBudgetDistributionItemDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMinistry!: number;

  @ApiProperty({ example: 62500, description: 'Monto anual en Lempiras' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  annualAmount!: number;
}

export class BulkReplaceBudgetDistributionsDto {
  @ApiProperty({ type: [BulkBudgetDistributionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkBudgetDistributionItemDto)
  items!: BulkBudgetDistributionItemDto[];
}
