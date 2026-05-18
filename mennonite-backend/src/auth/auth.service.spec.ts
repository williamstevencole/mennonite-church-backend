import { BadRequestException, ConflictException } from '@nestjs/common';
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

type PrismaMock = {
  userRole: {
    findFirst: jest.Mock<Promise<DefaultRole | null>, []>;
  };
  user: {
    count: jest.Mock<Promise<number>, []>;
    create: jest.Mock<Promise<{ id: number }>, [CreateUserArgs]>;
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
    },
  };

  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(prisma as never);
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
});
