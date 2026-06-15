import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Church, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { ChurchResponseDto } from './dto/church.response.dto';
import { ChurchesPageResponseDto } from './dto/churches-page.response.dto';
import { CreateChurchDto } from './dto/create-church.dto';
import { ListChurchesQueryDto } from './dto/list-churches-query.dto';
import { UpdateChurchDto } from './dto/update-church.dto';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';

@Injectable()
export class ChurchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChurchDto): Promise<IdNameResponseDto> {
    if (dto.idCity !== undefined) {
      await this.assertCity(dto.idCity);
    }
    const existing = await this.prisma.church.findFirst({
      where: { name: { equals: dto.name.trim(), mode: 'insensitive' } },
      select: { id: true, active: true },
    });
    if (existing?.active) {
      throw new ConflictException(
        `Ya existe una iglesia con el nombre "${dto.name}"`,
      );
    }
    if (existing) {
      const reactivated = await this.prisma.church.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          idCity: dto.idCity,
          rtn: dto.rtn,
          contactPhone: dto.contactPhone,
          founderName: dto.founderName,
          mission: dto.mission,
          vision: dto.vision,
          values: dto.values,
          foundationDate: dto.foundationDate,
          active: true,
        },
        select: { id: true, name: true },
      });
      return { id: reactivated.id, name: reactivated.name };
    }
    const created = await this.prisma.church.create({
      data: {
        name: dto.name,
        idCity: dto.idCity,
        rtn: dto.rtn,
        contactPhone: dto.contactPhone,
        founderName: dto.founderName,
        mission: dto.mission,
        vision: dto.vision,
        values: dto.values,
        foundationDate: dto.foundationDate,
      },
      select: { id: true, name: true },
    });
    return { id: created.id, name: created.name };
  }

  async findAll(query: ListChurchesQueryDto): Promise<ChurchesPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ChurchWhereInput =
      query.includeInactive === true ? {} : { active: true };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.church.count({ where }),
      this.prisma.church.findMany({
        where,
        orderBy: { name: 'asc' },
        ...buildPagination(page, limit),
      }),
    ]);

    return toPaginated(
      items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    );
  }

  async findOne(
    id: number,
    includeInactive = false,
  ): Promise<ChurchResponseDto> {
    const item = await this.prisma.church.findFirst({
      where: {
        id,
        ...(includeInactive ? {} : { active: true }),
      },
    });
    if (!item) {
      throw new NotFoundException(`Iglesia ${id} no encontrada`);
    }
    return this.toResponse(item);
  }

  async update(id: number, dto: UpdateChurchDto): Promise<IdNameResponseDto> {
    await this.assertExists(id);
    if (dto.idCity !== undefined) {
      await this.assertCity(dto.idCity);
    }
    if (dto.name !== undefined) {
      await this.assertNameUnique(dto.name, id);
    }
    const data: Prisma.ChurchUpdateInput = {
      name: dto.name,
      rtn: dto.rtn,
      contactPhone: dto.contactPhone,
      founderName: dto.founderName,
      mission: dto.mission,
      vision: dto.vision,
      values: dto.values,
      foundationDate: dto.foundationDate,
    };
    if (dto.idCity !== undefined) {
      data.city = { connect: { id: dto.idCity } };
    }

    const updated = await this.prisma.church.update({
      where: { id },
      data,
      select: { id: true, name: true },
    });
    return { id: updated.id, name: updated.name };
  }

  async remove(id: number): Promise<void> {
    await this.assertExists(id);
    await this.prisma.church.update({
      where: { id },
      data: { active: false },
    });
  }

  private async assertExists(id: number): Promise<void> {
    const found = await this.prisma.church.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException(`Iglesia ${id} no encontrada`);
    }
  }

  private async assertNameUnique(
    name: string,
    excludeId?: number,
  ): Promise<void> {
    const existing = await this.prisma.church.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe una iglesia con el nombre "${name}"`,
      );
    }
  }

  private async assertCity(idCity: number): Promise<void> {
    const exists = await this.prisma.city.findUnique({
      where: { id: idCity },
      select: { id: true },
    });
    if (!exists) {
      throw new BadRequestException(`La ciudad con id ${idCity} no existe`);
    }
  }

  private toResponse(church: Church): ChurchResponseDto {
    return {
      id: church.id,
      name: church.name,
      idCity: church.idCity,
      rtn: church.rtn,
      contactPhone: church.contactPhone,
      founderName: church.founderName,
      mission: church.mission,
      vision: church.vision,
      values: church.values,
      foundationDate: church.foundationDate,
      active: church.active,
    };
  }
}
