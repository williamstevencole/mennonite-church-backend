import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDate, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '../doc-type-enum';

export class CreateMemberDto {
  @ApiProperty() @IsString() name!: string;

  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @ApiProperty() @IsString() documentNumber!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() profession?: string;

  @ApiProperty() @Type(() => Date) @IsDate() birthDate!: Date;

  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;

  @ApiPropertyOptional() @IsOptional() @IsEmail() personalEmail?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  baptismDate?: Date;

  @ApiProperty() @Type(() => Date) @IsDate() joinDate!: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  inactivatedAt?: Date;
}
