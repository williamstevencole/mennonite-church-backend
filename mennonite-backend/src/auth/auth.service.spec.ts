import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

const mockPrismaService = {
  boardMember: {
    findFirst: jest.fn(),
  },
  ministryMember: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  userRole: {
    findFirst: jest.fn(),
  },
  church: {
    findUnique: jest.fn(),
  },
  member: {
    findFirst: jest.fn(),
  },
};

const mockSupabaseService = {
  getClient: jest.fn().mockReturnValue({
    auth: {
      signInWithPassword: jest.fn(),
      refreshSession: jest.fn(),
    },
  }),
  getAdminClient: jest.fn().mockReturnValue({
    auth: {
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
      },
    },
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  type AuthServicePrivates = {
    computeArea: (
      roleName: string,
      memberId: number | null,
      churchId: number,
    ) => Promise<'admin' | 'lider' | 'miembro'>;
  };
  const asPrivates = (s: AuthService): AuthServicePrivates =>
    s as unknown as AuthServicePrivates;

  describe('computeArea', () => {
    it('returns "admin" when role is "Administrador", regardless of membership', async () => {
      const result = await asPrivates(service).computeArea(
        'Administrador',
        null,
        1,
      );
      expect(result).toBe('admin');
      expect(mockPrismaService.boardMember.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.ministryMember.findFirst).not.toHaveBeenCalled();
    });

    it('returns "lider" when role is "Líder de Ministerio", regardless of membership', async () => {
      const result = await asPrivates(service).computeArea(
        'Líder de Ministerio',
        null,
        1,
      );
      expect(result).toBe('lider');
      expect(mockPrismaService.boardMember.findFirst).not.toHaveBeenCalled();
    });

    it('returns "miembro" when role is "Miembro", regardless of membership', async () => {
      const result = await asPrivates(service).computeArea('Miembro', null, 1);
      expect(result).toBe('miembro');
      expect(mockPrismaService.boardMember.findFirst).not.toHaveBeenCalled();
    });

    it('returns "miembro" when memberId is null on a non-system role', async () => {
      const result = await asPrivates(service).computeArea('Pastor', null, 1);
      expect(result).toBe('miembro');
      expect(mockPrismaService.boardMember.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.ministryMember.findFirst).not.toHaveBeenCalled();
    });

    it('returns "admin" when a non-system role is board member', async () => {
      mockPrismaService.boardMember.findFirst.mockResolvedValueOnce({ id: 10 });

      const result = await asPrivates(service).computeArea('Pastor', 5, 1);
      expect(result).toBe('admin');
      expect(mockPrismaService.boardMember.findFirst).toHaveBeenCalledWith({
        where: {
          idMember: 5,
          active: true,
          board: { active: true, idChurch: 1 },
        },
        select: { id: true },
      });
      expect(mockPrismaService.ministryMember.findFirst).not.toHaveBeenCalled();
    });

    it('returns "lider" when non-system role has leadership but no board', async () => {
      mockPrismaService.boardMember.findFirst.mockResolvedValueOnce(null);
      mockPrismaService.ministryMember.findFirst.mockResolvedValueOnce({
        id: 20,
      });

      const result = await asPrivates(service).computeArea('Tesorero', 5, 1);
      expect(result).toBe('lider');
      expect(mockPrismaService.ministryMember.findFirst).toHaveBeenCalled();
    });

    it('returns "miembro" when non-system role has neither board nor leadership', async () => {
      mockPrismaService.boardMember.findFirst.mockResolvedValueOnce(null);
      mockPrismaService.ministryMember.findFirst.mockResolvedValueOnce(null);

      const result = await asPrivates(service).computeArea('Tesorero', 5, 1);
      expect(result).toBe('miembro');
    });
  });
});
