import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthSessionDto, AuthTokensDto } from './dto/auth-session.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async login(dto: LoginRequestDto): Promise<AuthSessionDto> {
    const { data, error } = await this.supabase
      .getClient()
      .auth.signInWithPassword({ email: dto.email, password: dto.password });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const localUser = await this.findLocalUserBySupabaseUid(data.user.id);

    if (!localUser.active) {
      throw new ForbiddenException('Usuario desactivado');
    }

    return {
      user: this.toMeResponse(localUser),
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    };
  }

  async register(dto: RegisterRequestDto): Promise<AuthSessionDto> {
    const role = await this.prisma.userRole.findFirst({
      where: { id: dto.idUserRole, idChurch: dto.idChurch },
      select: { id: true, active: true },
    });

    if (!role?.active) {
      throw new BadRequestException(
        'Rol inexistente o no pertenece a la iglesia indicada',
      );
    }

    const church = await this.prisma.church.findUnique({
      where: { id: dto.idChurch },
      select: { id: true },
    });

    if (!church) {
      throw new BadRequestException('Iglesia inexistente');
    }

    const member = await this.prisma.member.findFirst({
      where: { id: dto.idMember, idChurch: dto.idChurch },
      select: { id: true },
    });
    if (!member) {
      throw new BadRequestException(
        'Miembro inexistente o no pertenece a la iglesia indicada',
      );
    }
    const memberHasUser = await this.prisma.user.findUnique({
      where: { idMember: dto.idMember },
      select: { id: true },
    });
    if (memberHasUser) {
      throw new ConflictException('El miembro ya tiene un usuario asociado');
    }

    const emailTaken = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (emailTaken) {
      throw new ConflictException(
        'Ya existe un usuario registrado con ese email',
      );
    }

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await this.supabase
      .getAdminClient()
      .auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      if (authError?.message?.includes('already been registered')) {
        throw new ConflictException(
          'Ya existe un usuario registrado con ese email',
        );
      }
      throw new BadRequestException(
        `Error creando usuario en Supabase Auth: ${authError?.message ?? 'desconocido'}`,
      );
    }

    const supabaseUid = authData.user.id;

    // 2. Create local user (rollback Supabase if fails)
    try {
      await this.prisma.user.create({
        data: {
          email: dto.email,
          supabaseUid,
          active: true,
          idChurch: dto.idChurch,
          idUserRole: dto.idUserRole,
          idMember: dto.idMember,
        },
      });
    } catch (error) {
      await this.supabase.getAdminClient().auth.admin.deleteUser(supabaseUid);
      throw error;
    }

    // 3. Sign in to obtain tokens
    const { data: signInData, error: signInError } = await this.supabase
      .getClient()
      .auth.signInWithPassword({ email: dto.email, password: dto.password });

    if (signInError || !signInData.session) {
      throw new InternalServerErrorException(
        `Usuario creado pero no se pudo iniciar sesion: ${signInError?.message ?? 'desconocido'}`,
      );
    }

    const localUser = await this.findLocalUserBySupabaseUid(supabaseUid);

    return {
      user: this.toMeResponse(localUser),
      accessToken: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token,
      expiresIn: signInData.session.expires_in,
    };
  }

  async refresh(dto: RefreshRequestDto): Promise<AuthTokensDto> {
    const { data, error } = await this.supabase
      .getClient()
      .auth.refreshSession({ refresh_token: dto.refreshToken });

    if (error || !data.session) {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
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

    return this.toMeResponse(user);
  }

  private async findLocalUserBySupabaseUid(supabaseUid: string) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseUid },
      select: {
        id: true,
        email: true,
        active: true,
        userRole: {
          select: {
            id: true,
            name: true,
            rolePermissions: {
              select: { permission: { select: { code: true } } },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Usuario autenticado en Supabase pero no encontrado en la base local',
      );
    }

    return user;
  }

  private toMeResponse(user: {
    id: number;
    email: string;
    userRole: {
      id: number;
      name: string;
      rolePermissions: { permission: { code: string } }[];
    } | null;
  }): MeResponseDto {
    if (!user.userRole) {
      throw new InternalServerErrorException(
        'El usuario no tiene rol asignado',
      );
    }

    const permissions = Array.from(
      new Set(user.userRole.rolePermissions.map((rp) => rp.permission.code)),
    );

    return {
      id: user.id,
      email: user.email,
      role: { id: user.userRole.id, name: user.userRole.name },
      permissions,
    };
  }
}
