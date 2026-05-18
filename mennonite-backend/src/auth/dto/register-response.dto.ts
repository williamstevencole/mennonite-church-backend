import { ApiProperty } from '@nestjs/swagger';

class RegisterRoleDto {
  @ApiProperty({ example: 2 })
  id: number;

  @ApiProperty({ example: 'Pastor' })
  name: string;
}

export class RegisterResponseDto {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ type: RegisterRoleDto })
  role: RegisterRoleDto;
}
