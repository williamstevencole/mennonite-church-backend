import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { RegisterResponseDto } from './dto/register-response.dto';

const MIN_PASSWORD_LENGTH = 8;
const DEFAULT_INITIAL_ROLE_NAME =
  process.env.AUTH_INITIAL_ROLE_NAME?.trim() || 'Administrador';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(payload: LoginRequestDto): Promise<LoginResponseDto> {
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password?.trim();

    if (!email || !password) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        active: true,
        userRole: {
          select: {
            id: true,
            name: true,
            rolePermissions: {
              select: {
                permission: {
                  select: {
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.passwordHash !== this.hashPassword(password)) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    if (!user.active) {
      throw new ForbiddenException('Usuario desactivado');
    }

    if (!user.userRole) {
      throw new InternalServerErrorException(
        'El usuario no tiene rol asignado',
      );
    }

    const permissions = Array.from(
      new Set(
        user.userRole.rolePermissions.map(
          (rolePermission) => rolePermission.permission.code,
        ),
      ),
    );

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.userRole.name,
      permissions,
    });

    return {
      access_token: accessToken,
      user: this.buildMeResponse({
        id: user.id,
        email: user.email,
        userRole: user.userRole,
      }),
    };
  }

  async me(userId: number): Promise<MeResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        active: true,
        userRole: {
          select: {
            id: true,
            name: true,
            rolePermissions: {
              select: {
                permission: {
                  select: {
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Token invalido: usuario no encontrado');
    }

    if (!user.active) {
      throw new ForbiddenException('Usuario desactivado');
    }

    if (!user.userRole) {
      throw new InternalServerErrorException(
        'El usuario no tiene rol asignado',
      );
    }

    return this.buildMeResponse({
      id: user.id,
      email: user.email,
      userRole: user.userRole,
    });
  }

  async register(payload: RegisterRequestDto): Promise<RegisterResponseDto> {
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password?.trim();

    if (!email) {
      throw new BadRequestException('El email es requerido');
    }

    if (!this.isValidEmail(email)) {
      throw new BadRequestException('El email no es valido');
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(
        'La password debe tener al menos 8 caracteres',
      );
    }

    const usersCount = await this.prisma.user.count();
    if (usersCount > 0) {
      throw new ConflictException(
        'La cuenta inicial ya fue creada para esta instancia',
      );
    }

    const defaultRole = await this.prisma.userRole.findFirst({
      where: {
        name: DEFAULT_INITIAL_ROLE_NAME,
        active: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!defaultRole) {
      throw new InternalServerErrorException(
        `No se encontro el rol inicial configurado (${DEFAULT_INITIAL_ROLE_NAME})`,
      );
    }

    try {
      const createdUser = await this.prisma.user.create({
        data: {
          email,
          passwordHash: this.hashPassword(password),
          active: true,
          idUserRole: defaultRole.id,
        },
        select: {
          id: true,
        },
      });

      return {
        id: createdUser.id,
        role: defaultRole,
      };
    } catch (error: unknown) {
      if (this.isDuplicateEmailError(error)) {
        throw new ConflictException(
          'Ya existe un usuario registrado con ese email',
        );
      }

      throw error;
    }
  }

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  private buildMeResponse(user: {
    id: number;
    email: string;
    userRole: {
      id: number;
      name: string;
      rolePermissions: Array<{
        permission: {
          code: string;
        };
      }>;
    };
  }): MeResponseDto {
    const permissions = Array.from(
      new Set(
        user.userRole.rolePermissions.map(
          (rolePermission) => rolePermission.permission.code,
        ),
      ),
    );

    return {
      id: user.id,
      email: user.email,
      role: {
        id: user.userRole.id,
        name: user.userRole.name,
      },
      permissions,
    };
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isDuplicateEmailError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const candidate = error as {
      code?: unknown;
      meta?: {
        target?: unknown;
      };
    };

    if (candidate.code !== 'P2002') {
      return false;
    }

    const target = candidate.meta?.target;

    if (Array.isArray(target)) {
      return target.includes('email');
    }

    if (typeof target === 'string') {
      return target.includes('email');
    }

    return true;
  }
}
