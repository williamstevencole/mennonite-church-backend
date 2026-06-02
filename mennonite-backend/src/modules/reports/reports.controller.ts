import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AvailabilityClosureResponseDto } from './dto/availability-closure.response.dto';
import { AvailabilityLiveResponseDto } from './dto/availability-live.response.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { ResultsSummaryResponseDto } from './dto/results-summary.response.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('availability/live')
  @Permissions('reports.read')
  @ApiOperation({
    summary:
      'Disponibilidad live: fondos+reserva del último cierre + delta del año en curso',
  })
  @ApiOkResponse({ type: AvailabilityLiveResponseDto })
  getAvailabilityLive(
    @CurrentUser() user: JwtPayload,
    @Query() query: AvailabilityQueryDto,
  ): Promise<AvailabilityLiveResponseDto> {
    return this.service.getAvailabilityLive(user.idChurch, query.year);
  }

  @Get('availability/:year')
  @Permissions('reports.read')
  @ApiOperation({
    summary: 'Disponibilidad al cierre del año (alimenta el pie chart)',
  })
  @ApiOkResponse({ type: AvailabilityClosureResponseDto })
  @ApiNotFoundResponse({ description: 'No existe cierre para ese año' })
  getAvailabilityAtClosure(
    @CurrentUser() user: JwtPayload,
    @Param('year', ParseIntPipe) year: number,
  ): Promise<AvailabilityClosureResponseDto> {
    return this.service.getAvailabilityAtClosure(user.idChurch, year);
  }

  @Get('results-summary/:year')
  @Permissions('reports.read')
  @ApiOperation({
    summary:
      'Resultados acumulados por categoría con comparativo año anterior y presupuesto',
  })
  @ApiOkResponse({ type: ResultsSummaryResponseDto })
  getResultsSummary(
    @CurrentUser() user: JwtPayload,
    @Param('year', ParseIntPipe) year: number,
  ): Promise<ResultsSummaryResponseDto> {
    return this.service.getResultsSummary(user.idChurch, year);
  }
}
