import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MemberAssignmentMemberDetailResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() documentType!: string;
  @ApiProperty() documentNumber!: string;
  @ApiPropertyOptional({ nullable: true })
  profession!: string | null;
  @ApiProperty() birthDate!: Date;
  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;
  @ApiPropertyOptional({ nullable: true })
  personalEmail!: string | null;
  @ApiPropertyOptional({ nullable: true })
  address!: string | null;
  @ApiPropertyOptional({ nullable: true })
  baptismDate!: Date | null;
  @ApiProperty() joinDate!: Date;
  @ApiProperty() active!: boolean;
}
