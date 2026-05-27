import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsDate, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '../doc-type-enum';

export class CreateMemberDto {
  @ApiProperty() @IsInt() idChurch!: number;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  documentType!: DocumentType;
  @ApiProperty() @IsString() documentNumber!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() profession!: string;
  @ApiProperty() @Type(() => Date) @IsDate() birthDate!: Date;
  @ApiPropertyOptional() @IsOptional() @IsString() phone!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() personalEmail!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  baptismDate!: Date;
  @ApiProperty() @Type(() => Date) @IsDate() joinDate!: Date;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  inactivatedAt!: Date | undefined;
}
