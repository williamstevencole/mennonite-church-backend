import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SupabaseService } from '../../supabase/supabase.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: JwtPayload;
    }>();

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }
    const token = authHeader.slice(7);

    const {
      data: { user: supabaseUser },
      error,
    } = await this.supabase.getClient().auth.getUser(token);

    if (error || !supabaseUser) {
      throw new UnauthorizedException('Token invalido o expirado');
    }

    const localUser = await this.prisma.user.findUnique({
      where: { supabaseUid: supabaseUser.id },
      select: {
        id: true,
        email: true,
        active: true,
        supabaseUid: true,
        idChurch: true,
        userRole: {
          select: {
            name: true,
            rolePermissions: {
              select: { permission: { select: { code: true } } },
            },
          },
        },
      },
    });

    if (!localUser) {
      throw new UnauthorizedException(
        'Usuario autenticado en Supabase pero no registrado localmente. Debe registrarse via POST /auth/register.',
      );
    }

    if (!localUser.active) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    const permissions = localUser.userRole
      ? Array.from(
          new Set(
            localUser.userRole.rolePermissions.map((rp) => rp.permission.code),
          ),
        )
      : [];

    request.user = {
      sub: localUser.id,
      supabaseUid: supabaseUser.id,
      email: localUser.email,
      idChurch: localUser.idChurch,
      role: localUser.userRole?.name ?? '',
      permissions,
    };

    return true;
  }
}
