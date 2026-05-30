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
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { EventTypeResponseDto } from './dto/event-type.response.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';
import { EventTypesService } from './event-types.service';

@ApiTags('Event Types')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('event-types')
export class EventTypesController {
  constructor(private readonly service: EventTypesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('catalog.event-types.manage')
  @ApiOperation({ summary: 'Crear un nuevo tipo de evento' })
  @ApiCreatedResponse({ type: EventTypeResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Nombre duplicado' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateEventTypeDto,
  ): Promise<EventTypeResponseDto> {
    return this.service.create(user.idChurch, dto);
  }

  @Get()
  @Permissions('catalog.event-types.read')
  @ApiOperation({ summary: 'Listar tipos de evento' })
  @ApiOkResponse({ type: EventTypeResponseDto, isArray: true })
  findAll(@CurrentUser() user: JwtPayload): Promise<EventTypeResponseDto[]> {
    return this.service.findAll(user.idChurch);
  }

  @Get(':id')
  @Permissions('catalog.event-types.read')
  @ApiOkResponse({ type: EventTypeResponseDto })
  @ApiNotFoundResponse({ description: 'Tipo de evento no encontrado' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EventTypeResponseDto> {
    return this.service.findOne(user.idChurch, id);
  }

  @Patch(':id')
  @Permissions('catalog.event-types.manage')
  @ApiOkResponse({ type: EventTypeResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Nombre duplicado' })
  @ApiNotFoundResponse({ description: 'Tipo de evento no encontrado' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventTypeDto,
  ): Promise<EventTypeResponseDto> {
    return this.service.update(user.idChurch, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('catalog.event-types.manage')
  @ApiNoContentResponse({ description: 'Tipo de evento eliminado' })
  @ApiConflictResponse({
    description: 'Existen eventos que usan este tipo',
  })
  @ApiNotFoundResponse({ description: 'Tipo de evento no encontrado' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.service.remove(user.idChurch, id);
  }
}
