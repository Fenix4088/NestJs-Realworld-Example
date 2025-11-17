import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty()
  readonly body: string;
}

export class CreateCommentBody {
  @ApiProperty({ type: CreateCommentDto })
  comment: CreateCommentDto;
}
