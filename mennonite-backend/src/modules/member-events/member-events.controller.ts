import {
  Controller,
  HttpCode,
  Get,
  Post,
  Body,
  Patch,
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
import { MemberEventsService } from './member-events.service';
import { IdResponseDto } from '../../common/dto/id-response.dto';
import { CreateMemberEventDto } from './dto/create-member-event.dto';
import { UpdateMemberEventDto } from './dto/update-member-event.dto';
import { ListMemberEventsQueryDto } from './dto/list-member-events-query.dto';
import { MemberEventsPageResponseDto } from './dto/member-events-page.response.dto';
import { MemberEventDetailResponseDto } from './dto/member-events-detail.response.dto';

@ApiTags('Member Events')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('member-events')
export class MemberEventsController {
  constructor(private readonly memberEventsService: MemberEventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('events.attendance.create')
  @ApiOperation({ summary: 'Registrar asistencia de un miembro a un evento' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido o FK inexistente' })
  @ApiConflictResponse({
    description: 'El miembro ya tiene asistencia registrada en este evento',
  })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMemberEventDto,
  ): Promise<IdResponseDto> {
    return this.memberEventsService.create(user, dto);
  }

  @Get()
  @Permissions('events.attendance.read')
  @ApiOperation({
    summary: 'Listar asistencias a eventos con filtros y paginacion',
  })
  @ApiOkResponse({ type: MemberEventsPageResponseDto })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListMemberEventsQueryDto,
  ): Promise<MemberEventsPageResponseDto> {
    return this.memberEventsService.findAll(user, query);
  }

  @Get(':id')
  @Permissions('events.attendance.read')
  @ApiOperation({ summary: 'Obtener detalle de una asistencia' })
  @ApiOkResponse({ type: MemberEventDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Registro de asistencia no encontrado' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MemberEventDetailResponseDto> {
    return this.memberEventsService.findOne(user, id);
  }

  @Patch(':id')
  @Permissions('events.attendance.update')
  @ApiOperation({ summary: 'Actualizar una asistencia (attended / notes)' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiNotFoundResponse({ description: 'Registro de asistencia no encontrado' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberEventDto,
  ): Promise<IdResponseDto> {
    return this.memberEventsService.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('events.attendance.delete')
  @ApiOperation({ summary: 'Eliminar un registro de asistencia' })
  @ApiNoContentResponse({ description: 'Asistencia eliminada' })
  @ApiNotFoundResponse({ description: 'Registro de asistencia no encontrado' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.memberEventsService.remove(user, id);
  }
}
