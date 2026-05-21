import { ApiProperty } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() code!: string;
  @ApiProperty() description!: string;
  @ApiProperty() active!: boolean;
}
