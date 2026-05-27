import { ApiProperty } from '@nestjs/swagger';

export class ArticleResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  unitCost!: number;
}
