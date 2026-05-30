import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDate,
  IsOptional,
  IsEnum,
  IsEmail,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { DocumentType } from '../doc-type-enum';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateMemberDto {
  @ApiProperty()
  @IsString()
  @Transform(trim)
  @MinLength(1)
  @MaxLength(60)
  name!: string;

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
