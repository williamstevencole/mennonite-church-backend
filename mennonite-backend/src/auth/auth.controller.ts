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
  ApiNoContentResponse,
  ApiNotFoundResponse,
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
import { CheckEmailRequestDto } from './dto/check-email-request.dto';
import { CheckEmailResponseDto } from './dto/check-email-response.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto';
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
  @Post('forgot-password/check-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar si existe una cuenta activa con el correo indicado',
  })
  @ApiOkResponse({ type: CheckEmailResponseDto })
  checkEmail(
    @Body() payload: CheckEmailRequestDto,
  ): Promise<CheckEmailResponseDto> {
    return this.authService.checkEmail(payload);
  }

  @Public()
  @Post('forgot-password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Restablecer la contraseña de una cuenta activa' })
  @ApiNoContentResponse({ description: 'Contraseña actualizada' })
  @ApiNotFoundResponse({
    description: 'No existe una cuenta activa con ese correo',
  })
  @ApiBadRequestResponse({ description: 'No se pudo actualizar la contraseña' })
  resetPassword(@Body() payload: ResetPasswordRequestDto): Promise<void> {
    return this.authService.resetPassword(payload);
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
