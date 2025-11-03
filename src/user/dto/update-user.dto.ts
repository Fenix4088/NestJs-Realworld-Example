import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  readonly username: string;
  
  @ApiProperty({ required: false })
  readonly email: string;
  
  @ApiProperty({ required: false })
  readonly bio: string;
  
  @ApiProperty({ required: false })
  readonly image: string;
}

export class UpdateUserBody {
  @ApiProperty({ type: UpdateUserDto })
  user: UpdateUserDto;
}