import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
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
import { IdResponseDto } from '../../common/dto/id-response.dto';
import { CreateFinancialReportDto } from './dto/create-financial-report.dto';
import { FinancialReportResponseDto } from './dto/financial-report.response.dto';
import { FinancialReportsPageResponseDto } from './dto/financial-reports-page.response.dto';
import { ListFinancialReportsQueryDto } from './dto/list-financial-reports-query.dto';
import { RejectFinancialReportDto } from './dto/reject-financial-report.dto';
import { UpdateFinancialReportDto } from './dto/update-financial-report.dto';
import { FinancialReportsService } from './financial-reports.service';

@ApiTags('Financial Reports')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial-reports')
export class FinancialReportsController {
  constructor(private readonly service: FinancialReportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('financial-reports.create')
  @ApiOperation({ summary: 'Crear reporte financiero (Draft)' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiNotFoundResponse({ description: 'Ministerio no encontrado' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateFinancialReportDto,
  ): Promise<IdResponseDto> {
    return this.service.create(user.idChurch, user.sub, dto);
  }

  @Get()
  @Permissions('financial-reports.read')
  @ApiOperation({
    summary:
      'Listar reportes paginados, filtrables por idMinistry, year, status',
  })
  @ApiOkResponse({ type: FinancialReportsPageResponseDto })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListFinancialReportsQueryDto,
  ): Promise<FinancialReportsPageResponseDto> {
    return this.service.findAll(user.idChurch, user, query);
  }

  @Get(':id')
  @Permissions('financial-reports.read')
  @ApiOperation({ summary: 'Detalle de un reporte' })
  @ApiOkResponse({ type: FinancialReportResponseDto })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<FinancialReportResponseDto> {
    return this.service.findOne(user.idChurch, id);
  }

  @Patch(':id')
  @Permissions('financial-reports.update')
  @ApiOperation({
    summary: 'Actualizar reporte (Draft/Presented). Approved es inmutable.',
  })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido o transición de estado inválida',
  })
  @ApiConflictResponse({ description: 'Reporte aprobado: inmutable' })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFinancialReportDto,
  ): Promise<IdResponseDto> {
    return this.service.update(user.idChurch, user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('financial-reports.delete')
  @ApiOperation({
    summary: 'Eliminar reporte (no permitido si está Approved)',
  })
  @ApiNoContentResponse({ description: 'Reporte eliminado' })
  @ApiConflictResponse({ description: 'Reporte aprobado: no eliminable' })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.service.remove(user.idChurch, id);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @Permissions('financial-reports.submit')
  @ApiOperation({
    summary: 'Enviar reporte de ministerio al concilio (Draft → Presented)',
  })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({
    description: 'Reporte no está en Draft o no es de ministerio',
  })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado' })
  @ApiForbiddenResponse({
    description: 'Usuario no es líder del ministerio del reporte',
  })
  submit(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IdResponseDto> {
    return this.service.submit(user.idChurch, user, id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Permissions('financial-reports.approve')
  @ApiOperation({
    summary: 'Aprobar reporte de ministerio (Presented → Approved)',
  })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiConflictResponse({
    description: 'El reporte no está en estado Presented',
  })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado' })
  approve(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IdResponseDto> {
    return this.service.approve(user.idChurch, id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Permissions('financial-reports.review')
  @ApiOperation({
    summary: 'Devolver reporte al líder con observación (Presented → Draft)',
  })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiConflictResponse({
    description: 'El reporte no está en estado Presented',
  })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado' })
  reject(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectFinancialReportDto,
  ): Promise<IdResponseDto> {
    return this.service.reject(user.idChurch, id, dto);
  }
}
