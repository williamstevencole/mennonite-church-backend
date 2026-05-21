import { ApiProperty } from '@nestjs/swagger';
import { MinistryListItemResponseDto } from './ministry-list-item.response.dto';

export class MinistriesPageResponseDto {
    @ApiProperty({ type: [MinistryListItemResponseDto] })
    data!: MinistryListItemResponseDto[];
    @ApiProperty() total!: number;
    @ApiProperty() page!: number;
    @ApiProperty() size!: number;
}
