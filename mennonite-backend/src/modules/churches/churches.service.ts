import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Church, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChurchResponseDto } from './dto/church.response.dto';
import { CreateChurchDto } from './dto/create-church.dto';
import { UpdateChurchDto } from './dto/update-church.dto';

@Injectable()
export class ChurchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChurchDto): Promise<ChurchResponseDto> {
    if (dto.idCity !== undefined) {
      await this.assertCity(dto.idCity);
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
    });
    return this.toResponse(created);
  }

  async findAll(): Promise<ChurchResponseDto[]> {
    const items = await this.prisma.church.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return items.map((item) => this.toResponse(item));
  }

  async findOne(id: number): Promise<ChurchResponseDto> {
    const item = await this.prisma.church.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Iglesia ${id} no encontrada`);
    }
    return this.toResponse(item);
  }

  async update(id: number, dto: UpdateChurchDto): Promise<ChurchResponseDto> {
    await this.assertExists(id);
    if (dto.idCity !== undefined) {
      await this.assertCity(dto.idCity);
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

    const updated = await this.prisma.church.update({ where: { id }, data });
    return this.toResponse(updated);
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
