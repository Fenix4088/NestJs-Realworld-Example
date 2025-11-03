import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty()
  readonly title: string;

  @ApiProperty()
  readonly description: string;

  @ApiProperty()
  readonly body: string;

  @ApiProperty({ type: [String], required: false })
  readonly tagList: string[];
}

export class CreateArticleBody {
  @ApiProperty({ type: CreateArticleDto })
  article: CreateArticleDto;
}
