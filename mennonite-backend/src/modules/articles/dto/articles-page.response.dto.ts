import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { ArticleResponseDto } from './article.response.dto';

export class ArticlesPageResponseDto extends PaginatedResponseDto<ArticleResponseDto> {
  @ApiProperty({ type: [ArticleResponseDto] })
  declare data: ArticleResponseDto[];
}
