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
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MemberEventService } from './member-event.service';
import { IdResponseDto } from '../../common/dto/id-response.dto';
import { CreateMemberEventDto } from './dto/create-member-event.dto';
import { UpdateMemberEventDto } from './dto/update-member-event.dto';
import { ListMemberEventsQueryDto } from './dto/list-member-events-query.dto';
import { MemberEventsPageResponseDto } from './dto/member-events-page.response.dto';
import { MemberEventDetailResponseDto } from './dto/member-events-detail.response.dto';

@ApiTags('Member Event')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('member-event')
export class MemberEventController {
  constructor(private readonly memberEventService: MemberEventService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('assignments.create')
  @ApiOperation({ summary: 'Asignar un evento a un miembro' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido o FK inexistente' })
  @ApiConflictResponse({ description: 'evento ya asignado al miembro' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMemberEventDto,
  ): Promise<IdResponseDto> {
    return this.memberEventService.create(user, dto);
  }

  @Get()
  @Permissions('assignments.read')
  @ApiOperation({
    summary: 'Listar integrantes de ministerios con filtros y paginacion',
  })
  @ApiOkResponse({ type: MemberEventsPageResponseDto })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListMemberEventsQueryDto,
  ): Promise<MemberEventsPageResponseDto> {
    return this.memberEventService.findAll(user, query);
  }

  @Get(':id')
  @Permissions('assignments.read')
  @ApiOperation({ summary: 'Obtener detalle de un integrante de evento' })
  @ApiOkResponse({ type: MemberEventDetailResponseDto })
  @ApiNotFoundResponse({
    description: 'Integrante de evento no encontrado',
  })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MemberEventDetailResponseDto> {
    return this.memberEventService.findOne(user, id);
  }

  @Patch(':id')
  @Permissions('assignments.update')
  @ApiOperation({ summary: 'Actualizar rol o fechas de un integrante' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido o FK inexistente' })
  @ApiNotFoundResponse({
    description: 'Integrante de evento no encontrado',
  })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberEventDto,
  ): Promise<IdResponseDto> {
    return this.memberEventService.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('assignments.delete')
  @ApiOperation({ summary: 'Retirar integrante de un evento' })
  @ApiNoContentResponse({ description: 'Integrante de evento retirado' })
  @ApiNotFoundResponse({
    description: 'Integrante de evento no encontrado',
  })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.memberEventService.remove(user, id);
  }
}
