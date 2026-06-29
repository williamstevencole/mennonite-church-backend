import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthSessionDto, AuthTokensDto } from './dto/auth-session.dto';
import { CheckEmailRequestDto } from './dto/check-email-request.dto';
import { CheckEmailResponseDto } from './dto/check-email-response.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto';
import { MeMemberDto, MeResponseDto } from './dto/me-response.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { Area, systemRoleArea } from './system-roles.constant';

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

    const { data: authData, error: authError } = await this.supabase
      .getAdminClient()
      .auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      throw new BadRequestException();
    }

    const supabaseUid = authData.user.id;

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

    const { data: signInData, error: signInError } = await this.supabase
      .getClient()
      .auth.signInWithPassword({ email: dto.email, password: dto.password });

    if (signInError || !signInData.session) {
      throw new InternalServerErrorException();
    }

    const localUser = await this.findLocalUserBySupabaseUid(supabaseUid);

    return {
      user: this.toMeResponse(localUser),
      accessToken: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token,
      expiresIn: signInData.session.expires_in,
    };
  }

  async checkEmail(dto: CheckEmailRequestDto): Promise<CheckEmailResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { active: true },
    });

    return { exists: !!user?.active };
  }

  async resetPassword(dto: ResetPasswordRequestDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { active: true, supabaseUid: true },
    });

    if (!user?.active || !user.supabaseUid) {
      throw new NotFoundException('No existe una cuenta activa con ese correo');
    }

    const { error } = await this.supabase
      .getAdminClient()
      .auth.admin.updateUserById(user.supabaseUid, {
        password: dto.password,
      });

    if (error) {
      throw new BadRequestException(
        `No se pudo actualizar la contraseña: ${error.message}`,
      );
    }
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
        idMember: true,
        idChurch: true,
        member: { select: { name: true } },
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

    const base = this.toMeResponse(user);
    const [area, member] = await Promise.all([
      this.computeArea(user.userRole.name, user.idMember, user.idChurch),
      this.buildMemberInfo(user.idMember, user.idChurch),
    ]);

    return { ...base, area, member };
  }

  private async findLocalUserBySupabaseUid(supabaseUid: string) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseUid },
      select: {
        id: true,
        email: true,
        active: true,
        member: { select: { name: true } },
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
    member: { name: string } | null;
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
      name: user.member?.name,
      role: { id: user.userRole.id, name: user.userRole.name },
      permissions,
      area: 'miembro' as const,
      member: null,
    };
  }

  private async computeArea(
    roleName: string,
    memberId: number | undefined | null,
    churchId: number,
  ): Promise<Area> {
    const systemArea = systemRoleArea(roleName);
    if (systemArea) return systemArea;

    if (!memberId) return 'miembro';

    const isBoard = await this.prisma.boardMember.findFirst({
      where: {
        idMember: memberId,
        active: true,
        board: { active: true, idChurch: churchId },
      },
      select: { id: true },
    });
    if (isBoard) return 'admin';

    const hasLeadership = await this.prisma.ministryMember.findFirst({
      where: {
        idMember: memberId,
        active: true,
        ministry: { active: true, idChurch: churchId },
        ministryRoleType: {
          NOT: { name: { equals: 'Miembro', mode: 'insensitive' } },
        },
      },
      select: { id: true },
    });
    return hasLeadership ? 'lider' : 'miembro';
  }

  private async buildMemberInfo(
    memberId: number | undefined | null,
    churchId: number,
  ): Promise<MeMemberDto | null> {
    if (!memberId) return null;

    const memberships = await this.prisma.ministryMember.findMany({
      where: {
        idMember: memberId,
        active: true,
        ministry: { active: true, idChurch: churchId },
      },
      include: { ministryRoleType: { select: { name: true } } },
    });

    const isBoardMember = !!(await this.prisma.boardMember.findFirst({
      where: {
        idMember: memberId,
        active: true,
        board: { active: true, idChurch: churchId },
      },
      select: { id: true },
    }));

    return {
      id: memberId,
      isBoardMember,
      ministryMemberships: memberships.map((mm) => mm.idMinistry),
      ministryLeaderships: memberships
        .filter((mm) => mm.ministryRoleType.name.toLowerCase() !== 'miembro')
        .map((mm) => mm.idMinistry),
    };
  }
}
