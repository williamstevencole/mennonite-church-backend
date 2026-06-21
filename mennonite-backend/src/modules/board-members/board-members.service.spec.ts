import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BoardMembersService } from './board-members.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBoardMemberDto } from './dto/create-board-member.dto';
import {
  BulkBoardMembersDto,
  BulkBoardMemberAddDto,
} from './dto/bulk-board-members.dto';

describe('BoardMembersService — duplicate member check', () => {
  let service: BoardMembersService;
  let prisma: {
    boardMember: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      count: jest.Mock;
    };
    board: { findFirst: jest.Mock };
    member: { findFirst: jest.Mock };
    boardRoleType: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      boardMember: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 99 }),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      board: { findFirst: jest.fn().mockResolvedValue({ id: 1 }) },
      member: {
        findFirst: jest.fn().mockResolvedValue({ id: 10, active: true }),
      },
      boardRoleType: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 5, name: 'Vocal', active: true }),
      },
      $transaction: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BoardMembersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(BoardMembersService);
  });

  const idChurch = 1;
  const dto: CreateBoardMemberDto = {
    idBoard: 1,
    idMember: 10,
    idBoardRoleType: 5,
    startDate: '2026-01-01',
  };

  describe('create', () => {
    it('throws ConflictException when member is already active in the same board', async () => {
      // board.findFirst, member.findFirst, boardRoleType.findFirst are set up in beforeEach
      // assertMemberNotInBoard → boardMember.findFirst returns a hit
      prisma.boardMember.findFirst.mockResolvedValueOnce({ id: 77 });

      await expect(service.create(idChurch, dto)).rejects.toThrow(
        'Este miembro ya forma parte del concilio',
      );
    });

    it('allows creation when member is not yet active in the board (non-unique role)', async () => {
      // assertMemberNotInBoard → no hit
      prisma.boardMember.findFirst.mockResolvedValueOnce(null);
      // Vocal is not a unique role, so no second findFirst call for unique-role check
      const result = await service.create(idChurch, dto);
      expect(result).toEqual({ id: 99 });
    });

    it('allows creation when member is not yet active in the board (unique role)', async () => {
      // Use a unique role name
      prisma.boardRoleType.findFirst.mockResolvedValue({
        id: 3,
        name: 'secretario',
        active: true,
      });
      const dtoUnique = { ...dto, idBoardRoleType: 3 };

      // assertMemberNotInBoard → no hit
      prisma.boardMember.findFirst.mockResolvedValueOnce(null);
      // unique-role check → no hit
      prisma.boardMember.findFirst.mockResolvedValueOnce(null);

      const result = await service.create(idChurch, dtoUnique);
      expect(result).toEqual({ id: 99 });
    });

    it('blocks a unique-role conflict independently of the member check', async () => {
      prisma.boardRoleType.findFirst.mockResolvedValue({
        id: 3,
        name: 'secretario',
        active: true,
      });
      const dtoUnique = { ...dto, idBoardRoleType: 3 };

      // assertMemberNotInBoard → no hit (member not yet in board)
      prisma.boardMember.findFirst.mockResolvedValueOnce(null);
      // unique-role check → conflict (role already taken by another member)
      prisma.boardMember.findFirst.mockResolvedValueOnce({ id: 55 });

      await expect(service.create(idChurch, dtoUnique)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('bulkUpdate — add path', () => {
    it('throws ConflictException when the same idMember appears twice in the adds list', async () => {
      const addItem1: BulkBoardMemberAddDto = {
        idMember: 10,
        idBoardRoleType: 5,
        startDate: '2026-01-01',
      };
      const addItem2: BulkBoardMemberAddDto = {
        idMember: 10,
        idBoardRoleType: 6,
        startDate: '2026-01-01',
      };
      const bulkDto: BulkBoardMembersDto = { add: [addItem1, addItem2] };

      await expect(service.bulkUpdate(idChurch, 1, bulkDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when a member is already active in the board (bulk add)', async () => {
      const addItem: BulkBoardMemberAddDto = {
        idMember: 10,
        idBoardRoleType: 5,
        startDate: '2026-01-01',
      };
      const bulkDto: BulkBoardMembersDto = { add: [addItem] };

      // boardRoleType.findFirst → valid role
      prisma.boardRoleType.findFirst.mockResolvedValueOnce({
        id: 5,
        name: 'Vocal',
        active: true,
      });
      // member.findFirst → active member
      prisma.member.findFirst.mockResolvedValueOnce({ id: 10 });
      // assertMemberNotInBoard → hit
      prisma.boardMember.findFirst.mockResolvedValueOnce({ id: 77 });

      await expect(service.bulkUpdate(idChurch, 1, bulkDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('adds successfully when member is not yet in the board (bulk add)', async () => {
      const addItem: BulkBoardMemberAddDto = {
        idMember: 10,
        idBoardRoleType: 5,
        startDate: '2026-01-01',
      };
      const bulkDto: BulkBoardMembersDto = { add: [addItem] };

      // boardRoleType.findFirst → valid non-unique role
      prisma.boardRoleType.findFirst.mockResolvedValueOnce({
        id: 5,
        name: 'Vocal',
        active: true,
      });
      // member.findFirst → active member
      prisma.member.findFirst.mockResolvedValueOnce({ id: 10 });
      // assertMemberNotInBoard → no hit
      prisma.boardMember.findFirst.mockResolvedValueOnce(null);
      // $transaction executes the queued ops
      prisma.$transaction.mockResolvedValueOnce([{ id: 99 }]);

      const result = await service.bulkUpdate(idChurch, 1, bulkDto);
      expect(result).toEqual({ added: 1, updated: 0, removed: 0 });
    });
  });
});
