import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { DashboardService } from './dashboard.service';
import { DashboardCashflowResponseDto } from './dto/dashboard-cashflow.response.dto';
import { DashboardKpisResponseDto } from './dto/dashboard-kpis.response.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('kpis')
  @Permissions('reports.read')
  @ApiOperation({
    summary:
      'KPIs ejecutivos para la pantalla raíz del concilio (miembros, balance, inventario, ministerios)',
  })
  @ApiOkResponse({ type: DashboardKpisResponseDto })
  getKpis(@CurrentUser() user: JwtPayload): Promise<DashboardKpisResponseDto> {
    return this.service.getKpis(user.idChurch);
  }

  @Get('cashflow')
  @Permissions('reports.read')
  @ApiOperation({
    summary: 'Serie de ingresos vs gastos por mes para el chart del dashboard',
  })
  @ApiQuery({ name: 'months', enum: [3, 6, 12], required: false })
  @ApiOkResponse({ type: DashboardCashflowResponseDto })
  getCashflow(
    @CurrentUser() user: JwtPayload,
    @Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number,
  ): Promise<DashboardCashflowResponseDto> {
    return this.service.getCashflow(user.idChurch, months);
  }
}
