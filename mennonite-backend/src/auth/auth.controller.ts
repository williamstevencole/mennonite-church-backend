import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuthSessionDto, AuthTokensDto } from './dto/auth-session.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nuevo usuario (crea en Supabase Auth + tabla local)',
  })
  @ApiCreatedResponse({ type: AuthSessionDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido o referencias FK rotas',
  })
  @ApiConflictResponse({
    description: 'Email duplicado o miembro ya con usuario',
  })
  register(@Body() payload: RegisterRequestDto): Promise<AuthSessionDto> {
    return this.authService.register(payload);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticar usuario contra Supabase Auth' })
  @ApiOkResponse({ type: AuthSessionDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales invalidas' })
  @ApiForbiddenResponse({ description: 'Usuario desactivado' })
  login(@Body() payload: LoginRequestDto): Promise<AuthSessionDto> {
    return this.authService.login(payload);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token usando el refresh token' })
  @ApiOkResponse({ type: AuthTokensDto })
  @ApiUnauthorizedResponse({ description: 'Refresh token invalido o expirado' })
  refresh(@Body() payload: RefreshRequestDto): Promise<AuthTokensDto> {
    return this.authService.refresh(payload);
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado actual' })
  @ApiOkResponse({ type: MeResponseDto })
  @ApiForbiddenResponse({ description: 'Usuario desactivado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  me(@CurrentUser() user: JwtPayload): Promise<MeResponseDto> {
    return this.authService.me(user.sub);
  }
}
