import { ApiProperty } from '@nestjs/swagger';
export class MemberBirthdayItemResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() birthDate!: Date;
  @ApiProperty() dayOfMonth!: number;
}
