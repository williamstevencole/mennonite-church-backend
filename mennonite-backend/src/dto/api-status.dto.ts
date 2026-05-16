import { ApiProperty } from '@nestjs/swagger';

export class ApiStatusDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: 'mennonite-backend' })
  service: string;
}
