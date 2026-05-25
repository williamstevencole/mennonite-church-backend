import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChurchResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) idCity!: number | null;
  @ApiPropertyOptional({ nullable: true }) rtn!: string | null;
  @ApiPropertyOptional({ nullable: true }) contactPhone!: string | null;
  @ApiPropertyOptional({ nullable: true }) founderName!: string | null;
  @ApiPropertyOptional({ nullable: true }) mission!: string | null;
  @ApiPropertyOptional({ nullable: true }) vision!: string | null;
  @ApiPropertyOptional({ nullable: true }) values!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date' })
  foundationDate!: Date | null;
  @ApiProperty() active!: boolean;
}
