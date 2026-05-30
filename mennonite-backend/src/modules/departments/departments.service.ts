import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Department } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { DepartmentResponseDto } from './dto/department.response.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { IdResponseDto } from '../../common/dto/id-response.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto): Promise<IdResponseDto> {
    await this.assertUniqueName(dto.name);
    const created = await this.prisma.department.create({
      data: { name: dto.name },
      select: { id: true },
    });
    return { id: created.id };
  }

  async findAll(): Promise<DepartmentResponseDto[]> {
    const items = await this.prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
    return items.map((item) => this.toResponse(item));
  }

  async findOne(id: number): Promise<DepartmentResponseDto> {
    const item = await this.prisma.department.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Departamento ${id} no encontrado`);
    }
    return this.toResponse(item);
  }

  async update(id: number, dto: UpdateDepartmentDto): Promise<IdResponseDto> {
    await this.assertExists(id);
    if (dto.name) {
      await this.assertUniqueName(dto.name, id);
    }
    const updated = await this.prisma.department.update({
      where: { id },
      data: { name: dto.name },
      select: { id: true },
    });
    return { id: updated.id };
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
      where: { name },
      select: { id: true },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Ya existe un departamento con el nombre "${name}"`,
      );
    }
  }

  private toResponse(entity: Department): DepartmentResponseDto {
    return { id: entity.id, name: entity.name };
  }
}
