import { Transform, Type } from 'class-transformer';
import { IsInt, IsString, MaxLength, Min } from 'class-validator';

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

  @IsString()
  @MaxLength(200)
  notes?: string;
}
