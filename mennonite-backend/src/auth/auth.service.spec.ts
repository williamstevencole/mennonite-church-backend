import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';

type CreateUserArgs = {
  data: {
    email: string;
    passwordHash: string;
    idUserRole: number;
    active: boolean;
  };
  select: {
    id: true;
  };
};

type DefaultRole = {
  id: number;
  name: string;
};

type MeUserRecord = {
  id: number;
  email: string;
  passwordHash?: string;
  active: boolean;
  userRole: {
    id: number;
    name: string;
    rolePermissions: Array<{
      permission: {
        code: string;
      };
    }>;
  } | null;
};

type PrismaMock = {
  userRole: {
    findFirst: jest.Mock<Promise<DefaultRole | null>, []>;
  };
  user: {
    count: jest.Mock<Promise<number>, []>;
    create: jest.Mock<Promise<{ id: number }>, [CreateUserArgs]>;
    findUnique: jest.Mock<Promise<MeUserRecord | null>, [unknown]>;
  };
};

describe('AuthService', () => {
  const prisma: PrismaMock = {
    userRole: {
      findFirst: jest.fn<Promise<DefaultRole | null>, []>(),
    },
    user: {
      count: jest.fn<Promise<number>, []>(),
      create: jest.fn<Promise<{ id: number }>, [CreateUserArgs]>(),
      findUnique: jest.fn<Promise<MeUserRecord | null>, [unknown]>(),
    },
  };
  const jwtService = {
    signAsync: jest.fn<Promise<string>, [unknown]>(),
  };

  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(
      prisma as never,
      jwtService as unknown as JwtService,
    );
  });

  it('returns created user id with default role', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.userRole.findFirst.mockResolvedValue({
      id: 1,
      name: 'Administrador',
    });
    prisma.user.create.mockResolvedValue({
      id: 10,
    });

    const result = await authService.register({
      email: ' Test@Church.Org ',
      password: 'Password123',
    });

    expect(result).toEqual({
      id: 10,
      role: {
        id: 1,
        name: 'Administrador',
      },
    });

    const createCallArgs = prisma.user.create.mock.calls[0][0];
    expect(createCallArgs.data.email).toBe('test@church.org');
    expect(createCallArgs.data.idUserRole).toBe(1);
    expect(createCallArgs.data.active).toBe(true);
    expect(createCallArgs.data.passwordHash).not.toBe('Password123');
    expect(createCallArgs.select).toEqual({ id: true });
  });

  it('throws conflict when email already exists', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.userRole.findFirst.mockResolvedValue({
      id: 1,
      name: 'Administrador',
    });
    prisma.user.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['email'] },
    });

    try {
      await authService.register({
        email: 'duplicado@church.org',
        password: 'Password123',
      });
      fail('Expected conflict exception for duplicated email');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as Error).message).toBe(
        'Ya existe un usuario registrado con ese email',
      );
    }
  });

  it('throws conflict when initial account already exists', async () => {
    prisma.user.count.mockResolvedValue(1);

    try {
      await authService.register({
        email: 'nuevo@church.org',
        password: 'Password123',
      });
      fail('Expected conflict exception when initial account already exists');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as Error).message).toBe(
        'La cuenta inicial ya fue creada para esta instancia',
      );
    }

    expect(prisma.userRole.findFirst).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('throws bad request for password shorter than 8 characters', async () => {
    try {
      await authService.register({
        email: 'usuario@church.org',
        password: '1234567',
      });
      fail('Expected bad request exception for short password');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as Error).message).toBe(
        'La password debe tener al menos 8 caracteres',
      );
    }

    expect(prisma.userRole.findFirst).not.toHaveBeenCalled();
  });

  it('returns id, email, role and permissions for authenticated user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 9,
      email: 'mi.usuario@iglesia.org',
      active: true,
      userRole: {
        id: 1,
        name: 'Administrador',
        rolePermissions: [
          { permission: { code: 'users.read' } },
          { permission: { code: 'users.write' } },
          { permission: { code: 'users.read' } },
        ],
      },
    });

    const result = await authService.me(9);

    expect(result).toEqual({
      id: 9,
      email: 'mi.usuario@iglesia.org',
      role: {
        id: 1,
        name: 'Administrador',
      },
      permissions: ['users.read', 'users.write'],
    });
  });

  it('returns access_token and user data when credentials are valid', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 11,
      email: 'admin@mennonite.local',
      passwordHash: hashPassword('Admin12345!'),
      active: true,
      userRole: {
        id: 1,
        name: 'Administrador',
        rolePermissions: [
          { permission: { code: 'users.read' } },
          { permission: { code: 'users.write' } },
        ],
      },
    });
    jwtService.signAsync.mockResolvedValue('jwt-token-demo');

    const result = await authService.login({
      email: 'ADMIN@mennonite.local',
      password: 'Admin12345!',
    });

    expect(result).toEqual({
      access_token: 'jwt-token-demo',
      user: {
        id: 11,
        email: 'admin@mennonite.local',
        role: {
          id: 1,
          name: 'Administrador',
        },
        permissions: ['users.read', 'users.write'],
      },
    });
  });

  it('throws unauthorized with generic message when email is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'noexiste@mennonite.local',
        password: 'Admin12345!',
      }),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      authService.login({
        email: 'noexiste@mennonite.local',
        password: 'Admin12345!',
      }),
    ).rejects.toThrow('Credenciales invalidas');
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('throws unauthorized with generic message when password is invalid', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 11,
      email: 'admin@mennonite.local',
      passwordHash: hashPassword('OtraPassword123!'),
      active: true,
      userRole: {
        id: 1,
        name: 'Administrador',
        rolePermissions: [],
      },
    });

    await expect(
      authService.login({
        email: 'admin@mennonite.local',
        password: 'Admin12345!',
      }),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      authService.login({
        email: 'admin@mennonite.local',
        password: 'Admin12345!',
      }),
    ).rejects.toThrow('Credenciales invalidas');
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('throws forbidden when login user is inactive', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 11,
      email: 'admin@mennonite.local',
      passwordHash: hashPassword('Admin12345!'),
      active: false,
      userRole: {
        id: 1,
        name: 'Administrador',
        rolePermissions: [],
      },
    });

    await expect(
      authService.login({
        email: 'admin@mennonite.local',
        password: 'Admin12345!',
      }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      authService.login({
        email: 'admin@mennonite.local',
        password: 'Admin12345!',
      }),
    ).rejects.toThrow('Usuario desactivado');
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('throws forbidden when authenticated user is deactivated', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 9,
      email: 'mi.usuario@iglesia.org',
      active: false,
      userRole: {
        id: 1,
        name: 'Administrador',
        rolePermissions: [],
      },
    });

    await expect(authService.me(9)).rejects.toThrow(ForbiddenException);
    await expect(authService.me(9)).rejects.toThrow('Usuario desactivado');
  });
});

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}
