import {
  Controller,
  HttpCode,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
  Query,
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EventResponsibleMembersService } from './event-responsible-members.service';
import { IdResponseDto } from '../../common/dto/id-response.dto';
import { CreateEventResponsibleMemberDto } from './dto/create-event-responsible-member.dto';
import { ListEventResponsibleMembersQueryDto } from './dto/list-event-responsible-members-query.dto';
import { EventResponsibleMembersPageResponseDto } from './dto/event-responsible-members-page.response.dto';
import { EventResponsibleMemberDetailResponseDto } from './dto/event-responsible-member-detail.response.dto';

@ApiTags('Event Responsible Members')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('event-responsible-members')
export class EventResponsibleMembersController {
  constructor(
    private readonly eventResponsibleMembersService: EventResponsibleMembersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('events.responsibles.create')
  @ApiOperation({ summary: 'Asignar un miembro como responsable de un evento' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido, evento o miembro inexistente',
  })
  @ApiConflictResponse({
    description: 'El miembro ya es responsable de este evento',
  })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateEventResponsibleMemberDto,
  ): Promise<IdResponseDto> {
    return this.eventResponsibleMembersService.create(user, dto);
  }

  @Get()
  @Permissions('events.responsibles.read')
  @ApiOperation({
    summary: 'Listar responsables de eventos con filtros y paginacion',
  })
  @ApiOkResponse({ type: EventResponsibleMembersPageResponseDto })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListEventResponsibleMembersQueryDto,
  ): Promise<EventResponsibleMembersPageResponseDto> {
    return this.eventResponsibleMembersService.findAll(user, query);
  }

  @Get(':id')
  @Permissions('events.responsibles.read')
  @ApiOperation({ summary: 'Obtener detalle de un responsable de evento' })
  @ApiOkResponse({ type: EventResponsibleMemberDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Responsable de evento no encontrado' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EventResponsibleMemberDetailResponseDto> {
    return this.eventResponsibleMembersService.findOne(user, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('events.responsibles.delete')
  @ApiOperation({
    summary: 'Eliminar la responsabilidad de un miembro sobre un evento',
  })
  @ApiNoContentResponse({ description: 'Responsabilidad eliminada' })
  @ApiNotFoundResponse({ description: 'Responsable de evento no encontrado' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.eventResponsibleMembersService.remove(user, id);
  }
}
