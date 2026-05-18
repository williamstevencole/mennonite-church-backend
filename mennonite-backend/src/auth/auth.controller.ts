import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterRequestDto } from './dto/register-request.dto';
import { RegisterResponseDto } from './dto/register-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar la cuenta inicial de la instancia' })
  @ApiCreatedResponse({ type: RegisterResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido, incluyendo password menor a 8 caracteres',
  })
  @ApiConflictResponse({
    description: 'Email duplicado o la cuenta inicial ya fue creada',
  })
  register(@Body() payload: RegisterRequestDto): Promise<RegisterResponseDto> {
    return this.authService.register(payload);
  }
}
