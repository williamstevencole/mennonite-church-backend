import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterRequestDto } from './dto/register-request.dto';
import { RegisterResponseDto } from './dto/register-response.dto';

const MIN_PASSWORD_LENGTH = 8;
const DEFAULT_INITIAL_ROLE_NAME =
  process.env.AUTH_INITIAL_ROLE_NAME?.trim() || 'Administrador';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

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
