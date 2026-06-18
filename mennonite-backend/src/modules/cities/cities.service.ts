import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { City, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { CitiesPageResponseDto } from './dto/cities-page.response.dto';
import { CityResponseDto } from './dto/city.response.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { ListCitiesQueryDto } from './dto/list-cities-query.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCityDto): Promise<IdNameResponseDto> {
    await this.assertDepartment(dto.idDepartment);
    await this.assertUnique(dto.name, dto.idDepartment);

    const created = await this.prisma.city.create({
      data: { name: dto.name, idDepartment: dto.idDepartment },
      select: { id: true, name: true },
    });
    return { id: created.id, name: created.name };
  }

  async findAll(query: ListCitiesQueryDto): Promise<CitiesPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CityWhereInput = { active: true };
    if (query.idDepartment !== undefined) {
      where.idDepartment = query.idDepartment;
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.city.count({ where }),
      this.prisma.city.findMany({
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

  async findOne(id: number): Promise<CityResponseDto> {
    const item = await this.prisma.city.findFirst({
      where: { id, active: true },
    });
    if (!item) {
      throw new NotFoundException(`Ciudad ${id} no encontrada`);
    }
    return this.toResponse(item);
  }

  async update(id: number, dto: UpdateCityDto): Promise<IdNameResponseDto> {
    const current = await this.prisma.city.findFirst({
      where: { id, active: true },
    });
    if (!current) {
      throw new NotFoundException(`Ciudad ${id} no encontrada`);
    }
    if (dto.idDepartment !== undefined) {
      await this.assertDepartment(dto.idDepartment);
    }
    if (dto.name || dto.idDepartment !== undefined) {
      await this.assertUnique(
        dto.name ?? current.name,
        dto.idDepartment ?? current.idDepartment,
        id,
      );
    }
    const updated = await this.prisma.city.update({
      where: { id },
      data: { name: dto.name, idDepartment: dto.idDepartment },
      select: { id: true, name: true },
    });
    return { id: updated.id, name: updated.name };
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.city.findUnique({
      where: { id },
      select: { id: true, active: true },
    });
    if (!existing) {
      throw new NotFoundException(`Ciudad ${id} no encontrada`);
    }

    // idempotente: si ya está inactiva, no hacer nada
    if (!existing.active) {
      return;
    }

    const churchCount = await this.prisma.church.count({
      where: { idCity: id, active: true },
    });
    if (churchCount > 0) {
      throw new ConflictException(
        `No se puede eliminar: ${churchCount} iglesia(s) usan esta ciudad`,
      );
    }
    await this.prisma.city.update({
      where: { id },
      data: { active: false },
    });
  }

  private async assertDepartment(idDepartment: number): Promise<void> {
    const exists = await this.prisma.department.findUnique({
      where: { id: idDepartment },
      select: { id: true },
    });
    if (!exists) {
      throw new BadRequestException(
        `El departamento con id ${idDepartment} no existe`,
      );
    }
  }

  private async assertUnique(
    name: string,
    idDepartment: number,
    excludeId?: number,
  ): Promise<void> {
    const dup = await this.prisma.city.findFirst({
      where: {
        idDepartment,
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (dup) {
      throw new ConflictException(
        `Ya existe la ciudad "${name}" en este departamento`,
      );
    }
  }

  private toResponse(entity: City): CityResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      idDepartment: entity.idDepartment,
    };
  }
}
