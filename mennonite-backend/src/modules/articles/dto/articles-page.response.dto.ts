import { ApiProperty } from '@nestjs/swagger';
import { ArticleResponseDto } from './article.response.dto';

export class ArticlesPageResponseDto {
  @ApiProperty({ type: [ArticleResponseDto] })
  data!: ArticleResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  size!: number;
}
