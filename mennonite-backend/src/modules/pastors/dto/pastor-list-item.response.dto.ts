import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PastorListItemResponseDto {
  @ApiProperty()
  member!: {
    id: number;
    name: string;
  };

  @ApiProperty()
  boardRoleType!: {
    id: number;
    name: string;
  };

  @ApiProperty()
  startDate!: Date;

  @ApiPropertyOptional({ nullable: true })
  endDate!: Date | null;
}
