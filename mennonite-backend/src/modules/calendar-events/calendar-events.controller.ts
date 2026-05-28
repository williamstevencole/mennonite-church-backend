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
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { CalendarEventsService } from './calendar-events.service';
import { CalendarEventResponseDto } from './dto/calendar-event.response.dto';
import { CalendarEventsPageResponseDto } from './dto/calendar-events-page.response.dto';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { ListCalendarEventsQueryDto } from './dto/list-calendar-events-query.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';

@ApiTags('Calendar Events')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('calendar-events')
export class CalendarEventsController {
  constructor(private readonly service: CalendarEventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('events.create')
  @ApiOperation({ summary: 'Crear evento de calendario' })
  @ApiCreatedResponse({ type: CalendarEventResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido o referencias inexistentes',
  })
  create(
    @Body() dto: CreateCalendarEventDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CalendarEventResponseDto> {
    return this.service.create(dto, user?.sub);
  }

  @Get()
  @Permissions('events.read')
  @ApiOperation({
    summary:
      'Listar eventos del calendario con filtros (rango de fechas, ministerio, tipo, estado) y paginacion',
  })
  @ApiOkResponse({ type: CalendarEventsPageResponseDto })
  @ApiBadRequestResponse({ description: 'Filtros invalidos' })
  findAll(
    @Query() query: ListCalendarEventsQueryDto,
  ): Promise<CalendarEventsPageResponseDto> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions('events.read')
  @ApiOperation({ summary: 'Obtener detalle de evento del calendario' })
  @ApiOkResponse({ type: CalendarEventResponseDto })
  @ApiNotFoundResponse({ description: 'Evento no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CalendarEventResponseDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('events.update')
  @ApiOperation({ summary: 'Actualizar evento del calendario' })
  @ApiOkResponse({ type: CalendarEventResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido o referencias inexistentes',
  })
  @ApiNotFoundResponse({ description: 'Evento no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCalendarEventDto,
  ): Promise<CalendarEventResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('events.delete')
  @ApiOperation({ summary: 'Eliminar evento del calendario' })
  @ApiNoContentResponse({ description: 'Evento eliminado' })
  @ApiNotFoundResponse({ description: 'Evento no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
