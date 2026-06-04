import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Department } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { DepartmentResponseDto } from './dto/department.response.dto';
import { DepartmentsPageResponseDto } from './dto/departments-page.response.dto';
import { ListDepartmentsQueryDto } from './dto/list-departments-query.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto): Promise<IdNameResponseDto> {
    await this.assertUniqueName(dto.name);
    const created = await this.prisma.department.create({
      data: { name: dto.name },
      select: { id: true, name: true },
    });
    return { id: created.id, name: created.name };
  }

  async findAll(
    query: ListDepartmentsQueryDto,
  ): Promise<DepartmentsPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.department.count(),
      this.prisma.department.findMany({
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

  async findOne(id: number): Promise<DepartmentResponseDto> {
    const item = await this.prisma.department.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Departamento ${id} no encontrado`);
    }
    return this.toResponse(item);
  }

  async update(
    id: number,
    dto: UpdateDepartmentDto,
  ): Promise<IdNameResponseDto> {
    await this.assertExists(id);
    if (dto.name) {
      await this.assertUniqueName(dto.name, id);
    }
    const updated = await this.prisma.department.update({
      where: { id },
      data: { name: dto.name },
      select: { id: true, name: true },
    });
    return { id: updated.id, name: updated.name };
  }

  async remove(id: number): Promise<void> {
    await this.assertExists(id);
    const cityCount = await this.prisma.city.count({
      where: { idDepartment: id },
    });
    if (cityCount > 0) {
      throw new ConflictException(
        `No se puede eliminar: ${cityCount} ciudad(es) pertenecen a este departamento`,
      );
    }
    await this.prisma.department.delete({ where: { id } });
  }

  private async assertExists(id: number): Promise<void> {
    const found = await this.prisma.department.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException(`Departamento ${id} no encontrado`);
    }
  }

  private async assertUniqueName(
    name: string,
    excludeId?: number,
  ): Promise<void> {
    const existing = await this.prisma.department.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe un departamento con el nombre "${name}"`,
      );
    }
  }

  private toResponse(entity: Department): DepartmentResponseDto {
    return { id: entity.id, name: entity.name };
  }
}
