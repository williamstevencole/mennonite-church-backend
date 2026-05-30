import { ApiProperty } from '@nestjs/swagger';
import { MeResponseDto } from './me-response.dto';

export class AuthTokensDto {
  @ApiProperty({ description: 'Access token JWT de Supabase' })
  accessToken!: string;

  @ApiProperty({ description: 'Refresh token de Supabase' })
  refreshToken!: string;

  @ApiProperty({
    description: 'Segundos hasta que expire el access token',
    example: 3600,
  })
  expiresIn!: number;
}

export class AuthSessionDto extends AuthTokensDto {
  @ApiProperty({ type: MeResponseDto })
  user!: MeResponseDto;
}
