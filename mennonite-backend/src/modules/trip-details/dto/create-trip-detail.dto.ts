import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateTripDetailDto {
  @Transform(({ value }) => Number(value))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idEvent!: number;

  @IsString()
  @MaxLength(200)
  origin!: string;

  @IsString()
  @MaxLength(200)
  destination!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;
}
