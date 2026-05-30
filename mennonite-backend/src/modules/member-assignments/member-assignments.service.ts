import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberRoleBelongsTo } from '../member-role-types/member-role-belongs-to.enum';
import { CreateMemberAssignmentDto } from './dto/create-member-assignment.dto';
import { ListMemberAssignmentsQueryDto } from './dto/list-member-assignments-query.dto';
import { MemberAssignmentCreatedResponseDto } from './dto/member-assignment-created.response.dto';
import { MemberAssignmentDetailResponseDto } from './dto/member-assignment-detail.response.dto';
import { MemberAssignmentListItemResponseDto } from './dto/member-assignment-list-item.response.dto';
import { MemberAssignmentsPageResponseDto } from './dto/member-assignments-page.response.dto';
import { UpdateMemberAssignmentDto } from './dto/update-member-assignment.dto';
import { MemberAssignmentType } from './member-assignment-type.enum';

const MEMBER_SUMMARY_SELECT = { id: true, name: true } as const;
const MEMBER_DETAIL_SELECT = {
  id: true,
  name: true,
  documentType: true,
  documentNumber: true,
  profession: true,
  birthDate: true,
  phone: true,
  personalEmail: true,
  address: true,
  baptismDate: true,
  joinDate: true,
  active: true,
} as const;
const ROLE_SELECT = { id: true, name: true } as const;
const TARGET_SELECT = { id: true, name: true } as const;

type AssignmentRow = {
  id: number;
  startDate: Date;
  endDate: Date | null;
  active: boolean;
  member: { id: number; name: string };
  memberRoleType: { id: number; name: string };
  board?: { id: number; name: string } | null;
  ministry?: { id: number; name: string } | null;
};

type AssignmentDetailRow = AssignmentRow & {
  member: Prisma.MemberGetPayload<{ select: typeof MEMBER_DETAIL_SELECT }>;
};

type TypeConfig = {
  expectedRole: MemberRoleBelongsTo;
  targetLabel: string; // human-readable: "concilio" | "ministerio"
};

const TYPE_CONFIG: Record<MemberAssignmentType, TypeConfig> = {
  [MemberAssignmentType.Board]: {
    expectedRole: MemberRoleBelongsTo.Council,
    targetLabel: 'concilio',
  },
  [MemberAssignmentType.Ministry]: {
    expectedRole: MemberRoleBelongsTo.Ministry,
    targetLabel: 'ministerio',
  },
};

@Injectable()
export class MemberAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: ListMemberAssignmentsQueryDto,
    user: JwtPayload,
  ): Promise<MemberAssignmentsPageResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const skip = (page - 1) * size;
    const orderBy = [
      { member: { name: 'asc' as const } },
      { id: 'asc' as const },
    ];

    const common = this.commonFilters(query);
    const include = this.assignmentInclude(query.type, MEMBER_SUMMARY_SELECT);

    if (query.type === MemberAssignmentType.Board) {
      const where: Prisma.BoardMemberWhereInput = {
        ...common,
        assignmentType: MemberAssignmentType.Board,
        board: { is: { idChurch } },
        ...(query.boardId ? { idBoard: query.boardId } : {}),
      };
      const [total, items] = await this.prisma.$transaction([
        this.prisma.boardMember.count({ where }),
        this.prisma.boardMember.findMany({
          where,
          include,
          orderBy,
          skip,
          take: size,
        }),
      ]);
      return {
        data: items.map((r) => this.toListItem(r, MemberAssignmentType.Board)),
        total,
        page,
        size,
      };
    }

    const where: Prisma.MinistryMemberWhereInput = {
      ...common,
      assignmentType: MemberAssignmentType.Ministry,
      ministry: { is: { idChurch } },
      ...(query.ministryId ? { idMinistry: query.ministryId } : {}),
    };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.ministryMember.count({ where }),
      this.prisma.ministryMember.findMany({
        where,
        include,
        orderBy,
        skip,
        take: size,
      }),
    ]);
    return {
      data: items.map((r) => this.toListItem(r, MemberAssignmentType.Ministry)),
      total,
      page,
      size,
    };
  }

  async findOne(
    id: number,
    user: JwtPayload,
  ): Promise<MemberAssignmentDetailResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const found = await this.findScopedDetail(id, idChurch);
    if (!found) {
      throw new NotFoundException(`Asignacion con id ${id} no encontrada`);
    }
    return this.toDetail(found.row, found.type);
  }

  async create(
    dto: CreateMemberAssignmentDto,
    user: JwtPayload,
  ): Promise<MemberAssignmentCreatedResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const type = dto.assignment_type;
    const config = TYPE_CONFIG[type];
    const targetId =
      type === MemberAssignmentType.Board ? dto.id_board : dto.id_ministry;

    if (!targetId) {
      throw new BadRequestException(
        `${type === MemberAssignmentType.Board ? 'id_board' : 'id_ministry'} es requerido para assignment_type=${type}`,
      );
    }

    const [member, role, targetExists] = await Promise.all([
      this.prisma.member.findFirst({
        where: { id: dto.id_member, idChurch },
        select: { id: true, active: true },
      }),
      this.prisma.memberRoleType.findUnique({
        where: { id: dto.id_member_role_type },
        select: { id: true, belongsTo: true, active: true },
      }),
      this.targetExists(type, targetId, idChurch),
    ]);

    if (!member) throw new BadRequestException('Miembro inexistente');
    if (!member.active)
      throw new BadRequestException('El miembro esta inactivo');
    if (!role || !role.active) {
      throw new BadRequestException('Rol de miembro inexistente');
    }
    if (role.belongsTo !== config.expectedRole) {
      throw new BadRequestException(
        `El rol no pertenece a ${config.targetLabel}`,
      );
    }
    if (!targetExists) {
      throw new BadRequestException(
        `${config.targetLabel[0].toUpperCase() + config.targetLabel.slice(1)} inexistente`,
      );
    }

    const startDate = new Date(dto.start_date);
    const endDate = dto.end_date ? new Date(dto.end_date) : null;
    if (endDate && endDate < startDate) {
      throw new BadRequestException(
        'end_date no puede ser anterior a start_date',
      );
    }

    if (await this.duplicateAssignment(type, targetId, dto.id_member)) {
      throw new ConflictException(
        `El miembro ya esta asignado en este ${config.targetLabel}`,
      );
    }

    const data = {
      idMember: dto.id_member,
      idMemberRoleType: dto.id_member_role_type,
      assignmentType: type,
      startDate,
      endDate,
      active: true,
      createdBy: user.sub,
    };

    const created =
      type === MemberAssignmentType.Board
        ? await this.prisma.boardMember.create({
            data: { ...data, idBoard: targetId },
            select: { id: true },
          })
        : await this.prisma.ministryMember.create({
            data: { ...data, idMinistry: targetId },
            select: { id: true },
          });

    return { id: created.id };
  }

  async update(
    id: number,
    dto: UpdateMemberAssignmentDto,
    user: JwtPayload,
  ): Promise<MemberAssignmentDetailResponseDto> {
    if (dto.id_member_role_type === undefined && dto.end_date === undefined) {
      throw new BadRequestException('Nada para actualizar');
    }

    const idChurch = await this.resolveChurchId(user);
    const existing = await this.findScopedBasic(id, idChurch);
    if (!existing) {
      throw new NotFoundException(`Asignacion con id ${id} no encontrada`);
    }

    let endDate: Date | undefined;
    if (dto.end_date !== undefined) {
      endDate = new Date(dto.end_date);
      if (endDate < existing.startDate) {
        throw new BadRequestException(
          'end_date no puede ser anterior a start_date',
        );
      }
    }

    if (dto.id_member_role_type !== undefined) {
      const role = await this.prisma.memberRoleType.findUnique({
        where: { id: dto.id_member_role_type },
        select: { id: true, belongsTo: true, active: true },
      });
      if (!role || !role.active) {
        throw new BadRequestException('Rol de miembro inexistente');
      }
      if (role.belongsTo !== TYPE_CONFIG[existing.type].expectedRole) {
        throw new BadRequestException(
          `El rol no pertenece a ${TYPE_CONFIG[existing.type].targetLabel}`,
        );
      }
    }

    const data: Prisma.BoardMemberUpdateInput &
      Prisma.MinistryMemberUpdateInput = {};
    if (dto.id_member_role_type !== undefined) {
      data.memberRoleType = { connect: { id: dto.id_member_role_type } };
    }
    if (endDate !== undefined) {
      data.endDate = endDate;
      data.active = false;
    }

    if (existing.type === MemberAssignmentType.Board) {
      await this.prisma.boardMember.update({ where: { id }, data });
    } else {
      await this.prisma.ministryMember.update({ where: { id }, data });
    }

    return this.findOne(id, user);
  }

  async remove(id: number, user: JwtPayload): Promise<void> {
    const idChurch = await this.resolveChurchId(user);
    const existing = await this.findScopedBasic(id, idChurch);
    if (!existing) {
      throw new NotFoundException(`Asignacion con id ${id} no encontrada`);
    }

    const data = { active: false };
    if (existing.type === MemberAssignmentType.Board) {
      await this.prisma.boardMember.update({ where: { id }, data });
    } else {
      await this.prisma.ministryMember.update({ where: { id }, data });
    }
  }

  private commonFilters(
    query: ListMemberAssignmentsQueryDto,
  ): Prisma.BoardMemberWhereInput & Prisma.MinistryMemberWhereInput {
    const where: Prisma.BoardMemberWhereInput &
      Prisma.MinistryMemberWhereInput = {};
    if (query.active !== undefined) where.active = query.active;
    if (query.memberId) where.idMember = query.memberId;
    if (query.role) {
      const trimmed = query.role.trim();
      if (/^\d+$/.test(trimmed)) {
        where.idMemberRoleType = Number(trimmed);
      } else {
        where.memberRoleType = {
          name: { equals: trimmed, mode: 'insensitive' },
        };
      }
    }
    return where;
  }

  private assignmentInclude<S extends Prisma.MemberSelect>(
    type: MemberAssignmentType,
    memberSelect: S,
  ) {
    const base = {
      member: { select: memberSelect },
      memberRoleType: { select: ROLE_SELECT },
    };
    return type === MemberAssignmentType.Board
      ? { ...base, board: { select: TARGET_SELECT } }
      : { ...base, ministry: { select: TARGET_SELECT } };
  }

  private async findScopedBasic(
    id: number,
    idChurch: number,
  ): Promise<{ type: MemberAssignmentType; startDate: Date } | null> {
    const board = await this.prisma.boardMember.findFirst({
      where: {
        id,
        assignmentType: MemberAssignmentType.Board,
        board: { is: { idChurch } },
      },
      select: { startDate: true },
    });
    if (board)
      return { type: MemberAssignmentType.Board, startDate: board.startDate };

    const ministry = await this.prisma.ministryMember.findFirst({
      where: {
        id,
        assignmentType: MemberAssignmentType.Ministry,
        ministry: { is: { idChurch } },
      },
      select: { startDate: true },
    });
    if (ministry) {
      return {
        type: MemberAssignmentType.Ministry,
        startDate: ministry.startDate,
      };
    }
    return null;
  }

  private async findScopedDetail(
    id: number,
    idChurch: number,
  ): Promise<{ type: MemberAssignmentType; row: AssignmentDetailRow } | null> {
    const include = (type: MemberAssignmentType) =>
      this.assignmentInclude(type, MEMBER_DETAIL_SELECT);

    const board = await this.prisma.boardMember.findFirst({
      where: {
        id,
        assignmentType: MemberAssignmentType.Board,
        board: { is: { idChurch } },
      },
      include: include(MemberAssignmentType.Board),
    });
    if (board) {
      return {
        type: MemberAssignmentType.Board,
        row: board,
      };
    }

    const ministry = await this.prisma.ministryMember.findFirst({
      where: {
        id,
        assignmentType: MemberAssignmentType.Ministry,
        ministry: { is: { idChurch } },
      },
      include: include(MemberAssignmentType.Ministry),
    });
    if (ministry) {
      return {
        type: MemberAssignmentType.Ministry,
        row: ministry,
      };
    }
    return null;
  }

  private async targetExists(
    type: MemberAssignmentType,
    targetId: number,
    idChurch: number,
  ): Promise<boolean> {
    if (type === MemberAssignmentType.Board) {
      const board = await this.prisma.board.findFirst({
        where: { id: targetId, idChurch },
        select: { id: true },
      });
      return board !== null;
    }
    const ministry = await this.prisma.ministry.findFirst({
      where: { id: targetId, idChurch },
      select: { id: true },
    });
    return ministry !== null;
  }

  private async duplicateAssignment(
    type: MemberAssignmentType,
    targetId: number,
    memberId: number,
  ): Promise<boolean> {
    if (type === MemberAssignmentType.Board) {
      const dup = await this.prisma.boardMember.findFirst({
        where: {
          idBoard: targetId,
          idMember: memberId,
          assignmentType: MemberAssignmentType.Board,
          active: true,
        },
        select: { id: true },
      });
      return dup !== null;
    }
    const dup = await this.prisma.ministryMember.findFirst({
      where: {
        idMinistry: targetId,
        idMember: memberId,
        assignmentType: MemberAssignmentType.Ministry,
        active: true,
      },
      select: { id: true },
    });
    return dup !== null;
  }

  private targetOf(row: AssignmentRow, type: MemberAssignmentType) {
    const target =
      type === MemberAssignmentType.Board ? row.board : row.ministry;
    return target ? { id: target.id, name: target.name } : null;
  }

  private toListItem(
    row: AssignmentRow,
    type: MemberAssignmentType,
  ): MemberAssignmentListItemResponseDto {
    return {
      id: row.id,
      assignmentType: type,
      member: { id: row.member.id, name: row.member.name },
      role: { id: row.memberRoleType.id, name: row.memberRoleType.name },
      target: this.targetOf(row, type),
      startDate: row.startDate,
      endDate: row.endDate,
      active: row.active,
    };
  }

  private toDetail(
    row: AssignmentDetailRow,
    type: MemberAssignmentType,
  ): MemberAssignmentDetailResponseDto {
    return {
      id: row.id,
      assignmentType: type,
      member: {
        id: row.member.id,
        name: row.member.name,
        documentType: row.member.documentType,
        documentNumber: row.member.documentNumber,
        profession: row.member.profession,
        birthDate: row.member.birthDate,
        phone: row.member.phone,
        personalEmail: row.member.personalEmail,
        address: row.member.address,
        baptismDate: row.member.baptismDate,
        joinDate: row.member.joinDate,
        active: row.member.active,
      },
      role: { id: row.memberRoleType.id, name: row.memberRoleType.name },
      target: this.targetOf(row, type),
      startDate: row.startDate,
      endDate: row.endDate,
      active: row.active,
    };
  }

  private async resolveChurchId(user: JwtPayload): Promise<number> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { idChurch: true },
    });
    if (!userRecord) throw new BadRequestException('Usuario no encontrado');
    if (!userRecord.idChurch) {
      throw new BadRequestException('El usuario no tiene iglesia asignada');
    }
    return userRecord.idChurch;
  }
}
