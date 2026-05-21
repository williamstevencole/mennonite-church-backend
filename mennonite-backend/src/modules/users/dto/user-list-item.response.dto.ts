import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserListItemResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() email!: string;
  @ApiPropertyOptional({ nullable: true })
  name!: string | null;
  @ApiPropertyOptional({ nullable: true })
  role!: string | null;
  @ApiProperty() active!: boolean;
}
