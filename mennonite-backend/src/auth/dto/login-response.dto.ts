import { ApiProperty } from '@nestjs/swagger';
import { MeResponseDto } from './me-response.dto';

export class LoginResponseDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AbWVubm9uaXRlLmxvY2FsIiwiaWF0IjoxNzE2MDAwMDAwLCJleHAiOjE3MTYwMDM2MDB9.demo-signature',
  })
  access_token!: string;

  @ApiProperty({ type: MeResponseDto })
  user!: MeResponseDto;
}
