import {
  Injectable
} from '@nestjs/common';
import { Prisma } from '.prisma/client/wasm';
import { PrismaService } from '../../prisma/prisma.service';
import { ListMinistriesQueryDto } from './dto/list-ministries-query.dto';
import { MinistriesPageResponseDto } from './dto/ministries-page.response.dto';
import { MinistryListItemResponseDto } from './dto/ministry-list-item.response.dto';

@Injectable()
export class MinistriesService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(query: ListMinistriesQueryDto): Promise<MinistriesPageResponseDto> {
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const where: Prisma.MinistryWhereInput = {};

    if (query.active !== undefined) {
      where.active = query.active;
    }

    const [total, ministries] = await this.prisma.$transaction([
      this.prisma.ministry.count({ where }),
      this.prisma.ministry.findMany({
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

  findOne(id: number) {
    return `This action returns a #${id} ministry`;
  }

  remove(id: number) {
    return `This action removes a #${id} ministry`;
  }


  private toListItem(ministry): MinistryListItemResponseDto {
    return {
      id: ministry.id,
      idChurch: ministry.idChurch,
      name: ministry.name,
      code: ministry.code,
      active: ministry.active,
    };
  }
}

