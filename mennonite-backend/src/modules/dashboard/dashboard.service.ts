import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { DashboardKpisResponseDto } from './dto/dashboard-kpis.response.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportsService: ReportsService,
  ) {}

  async getKpis(idChurch: number): Promise<DashboardKpisResponseDto> {
    const [membersActive, inventoryItems, ministriesActive, availability] =
      await Promise.all([
        this.prisma.member.count({ where: { idChurch, active: true } }),
        this.prisma.article.count({ where: { idChurch, active: true } }),
        this.prisma.ministry.count({ where: { idChurch, active: true } }),
        this.reportsService.getAvailabilityLive(idChurch),
      ]);

    return {
      membersActive,
      currentBalance: availability.disponibilidadTotal,
      inventoryItems,
      ministriesActive,
    };
  }
}
