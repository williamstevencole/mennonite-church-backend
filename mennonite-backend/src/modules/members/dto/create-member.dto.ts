import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDate,
  IsOptional,
  IsEnum,
  IsEmail,
  IsBoolean,
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

  @ApiPropertyOptional({
    description:
      'Estado de membresía (true = activo). En update controla la activación/desactivación; inactivated_at se deriva de este valor.',
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  inactivatedAt?: Date;
}
