import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshRequestDto {
  @ApiProperty({ description: 'Refresh token recibido en login/register' })
  @IsString()
  refreshToken!: string;
}
