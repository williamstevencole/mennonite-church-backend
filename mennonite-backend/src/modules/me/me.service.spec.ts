import { Test, TestingModule } from '@nestjs/testing';
import { MeService } from './me.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
  },
  ministryMember: {
    findMany: jest.fn(),
  },
};

describe('MeService', () => {
  let service: MeService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MeService>(MeService);
  });

  describe('findMyMinistries', () => {
    it('returns [] when user has no idMember', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        idMember: null,
        idChurch: 1,
      });

      const result = await service.findMyMinistries(99);
      expect(result).toEqual([]);
      expect(mockPrismaService.ministryMember.findMany).not.toHaveBeenCalled();
    });

    it('sets the NOT filter on ministryRoleType when roleFilter is "leader"', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        idMember: 5,
        idChurch: 1,
      });
      mockPrismaService.ministryMember.findMany.mockResolvedValueOnce([]);

      await service.findMyMinistries(99, 'leader');

      expect(mockPrismaService.ministryMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            ministryRoleType: {
              NOT: { name: { equals: 'Miembro', mode: 'insensitive' } },
            },
          }),
        }),
      );
    });

    it('sets the name equals filter on ministryRoleType when roleFilter is "member"', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        idMember: 5,
        idChurch: 1,
      });
      mockPrismaService.ministryMember.findMany.mockResolvedValueOnce([]);

      await service.findMyMinistries(99, 'member');

      expect(mockPrismaService.ministryMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            ministryRoleType: {
              name: { equals: 'Miembro', mode: 'insensitive' },
            },
          }),
        }),
      );
    });

    it('maps rows to MyMinistryDto correctly, converting startDate to ISO string', async () => {
      const startDate = new Date('2025-03-12T14:00:00.000Z');
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        idMember: 5,
        idChurch: 1,
      });
      mockPrismaService.ministryMember.findMany.mockResolvedValueOnce([
        {
          ministry: { id: 12, name: 'Alabanza y Adoración', active: true },
          ministryRoleType: { id: 5, name: 'Líder' },
          startDate,
        },
      ]);

      const result = await service.findMyMinistries(99);

      expect(result).toEqual([
        {
          ministry: { id: 12, name: 'Alabanza y Adoración', active: true },
          role: { id: 5, name: 'Líder' },
          joinedAt: startDate.toISOString(),
        },
      ]);
    });
  });
});
