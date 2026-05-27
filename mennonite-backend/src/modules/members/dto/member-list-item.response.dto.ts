import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DocumentType } from '../doc-type-enum';

export class MemberListItemResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() idChurch!: number;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: DocumentType }) documentType!: DocumentType;
  @ApiProperty() documentNumber!: string;
  @ApiPropertyOptional() profession!: string | null;
  @ApiProperty() @Type(() => Date) birthDate!: Date;
  @ApiPropertyOptional() phone!: string | null;
  @ApiPropertyOptional() personalEmail!: string | null;
  @ApiPropertyOptional() address!: string | null;
  @ApiPropertyOptional() @Type(() => Date) baptismDate!: Date | null;
  @ApiProperty() @Type(() => Date) joinDate!: Date;
  @ApiPropertyOptional() @Type(() => Date) inactivatedAt!: Date | null;
  @ApiProperty() active!: boolean;
}
