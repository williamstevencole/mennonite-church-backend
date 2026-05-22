import { Injectable } from '@nestjs/common';
import { Ministry, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListMinistriesQueryDto } from './dto/list-ministries-query.dto';
import { MinistriesPageResponseDto } from './dto/ministries-page.response.dto';
import { MinistryListItemResponseDto } from './dto/ministry-list-item.response.dto';

@Injectable()
export class MinistriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: ListMinistriesQueryDto,
  ): Promise<MinistriesPageResponseDto> {
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const where: Prisma.MinistryWhereInput = {};

    if (query.active !== undefined) {
      where.active = query.active;
    }

    const [total, ministries] = await this.prisma.$transaction([
      this.prisma.ministry.count({ where }),
      this.prisma.ministry.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * size,
        take: size,
      }),
    ]);

    return {
      data: ministries.map((ministry) => this.toListItem(ministry)),
      total,
      page,
      size,
    };
  }

  private toListItem(ministry: Ministry): MinistryListItemResponseDto {
    return {
      id: ministry.id,
      idChurch: ministry.idChurch,
      name: ministry.name,
      code: ministry.code,
      active: ministry.active,
    };
  }
}
