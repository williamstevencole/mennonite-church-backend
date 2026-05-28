import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BoardResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true })
  description!: string | null;
  @ApiProperty() startDate!: Date;
  @ApiProperty() endDate!: Date;
  @ApiProperty() active!: boolean;
}
