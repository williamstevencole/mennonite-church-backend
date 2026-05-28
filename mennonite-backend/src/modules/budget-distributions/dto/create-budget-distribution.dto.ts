import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, Min, Max } from 'class-validator';

export class CreateBudgetDistributionDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idBudget: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMinistry: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  percentage: number;
}
