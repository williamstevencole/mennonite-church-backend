import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { JwtPayload } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { RegisterResponseDto } from './dto/register-response.dto';

const AUTH_SESSION_COOKIE_NAME =
  process.env.AUTH_SESSION_COOKIE_NAME?.trim() || 'access_token';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
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

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar usuario existente con email y password',
  })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Credenciales invalidas',
  })
  @ApiForbiddenResponse({ description: 'Usuario desactivado' })
  login(@Body() payload: LoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login(payload);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cerrar sesion del usuario autenticado' })
  @ApiNoContentResponse({ description: 'Sesion cerrada' })
  @ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(AUTH_SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado actual' })
  @ApiOkResponse({ type: MeResponseDto })
  @ApiForbiddenResponse({ description: 'Usuario desactivado' })
  @ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
  me(@CurrentUser() user: JwtPayload): Promise<MeResponseDto> {
    return this.authService.me(user.sub);
  }
}
