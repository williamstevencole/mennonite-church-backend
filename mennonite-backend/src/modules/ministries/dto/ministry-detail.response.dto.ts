import { ApiProperty } from '@nestjs/swagger';
import { MinistryMemberListItemResponseDto } from './ministry-member-list-item.response.dto';

export class MinistryDetailResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() idChurch!: number;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() active!: boolean;
  @ApiProperty({ type: MinistryMemberListItemResponseDto, isArray: true })
  members!: MinistryMemberListItemResponseDto[];
}
