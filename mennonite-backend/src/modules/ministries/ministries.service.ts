import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateMinistryDto } from './dto/create-ministry.dto';
import { MinistryCreatedResponseDto } from './dto/ministry-created.response.dto';

@Injectable()
export class MinistriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMinistryDto, user: any): Promise<MinistryCreatedResponseDto> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { idChurch: true },
    });

    if (!userRecord) {
      throw new BadRequestException('User not found');
    }

    const idChurch = userRecord.idChurch;

    if (!idChurch) {
      throw new BadRequestException('User has no church assigned');
    }

    const existing = await this.prisma.ministry.findUnique({
      where: {
        idChurch_code: {
          idChurch,
          code: dto.code,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Ministry code already exists');
    }

    if (dto.id_leader_member) {
      const member = await this.prisma.member.findUnique({
        where: { id: dto.id_leader_member },
      });

      if (!member) {
        throw new BadRequestException('Leader member does not exist');
      }

      if (!member.active) {
        throw new BadRequestException('Leader member is inactive');
      }
    }

    const ministry = await this.prisma.ministry.create({
      data: {
        idChurch,
        code: dto.code,
        name: dto.name,
        createdBy: user.sub,
      },
    });

    return { id: ministry.id };
  }
}