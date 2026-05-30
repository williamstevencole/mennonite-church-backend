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
import { CreateMemberAssignmentDto } from './dto/create-member-assignment.dto';
import { ListMemberAssignmentsQueryDto } from './dto/list-member-assignments-query.dto';
import { MemberAssignmentDetailResponseDto } from './dto/member-assignment-detail.response.dto';
import { MemberAssignmentsPageResponseDto } from './dto/member-assignments-page.response.dto';
import { UpdateMemberAssignmentDto } from './dto/update-member-assignment.dto';
import { MemberAssignmentsService } from './member-assignments.service';
import { IdResponseDto } from '../../common/dto/id-response.dto';

@ApiTags('Member Assignments')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('member-assignments')
export class MemberAssignmentsController {
  constructor(private readonly service: MemberAssignmentsService) {}

  @Get()
  @Permissions('assignments.read')
  @ApiOperation({
    summary: 'Listar asignaciones de miembros (requiere ?type=board|ministry)',
  })
  @ApiOkResponse({ type: MemberAssignmentsPageResponseDto })
  findAll(
    @Query() query: ListMemberAssignmentsQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<MemberAssignmentsPageResponseDto> {
    return this.service.findAll(query, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('assignments.create')
  @ApiOperation({ summary: 'Asignar un miembro a un ministerio o concilio' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido o FK inexistente' })
  @ApiConflictResponse({ description: 'Miembro ya asignado al destino' })
  create(
    @Body() dto: CreateMemberAssignmentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdResponseDto> {
    return this.service.create(dto, user);
  }

  @Get(':id')
  @Permissions('assignments.read')
  @ApiOperation({ summary: 'Obtener detalle de una asignacion' })
  @ApiOkResponse({ type: MemberAssignmentDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Asignacion no encontrada' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<MemberAssignmentDetailResponseDto> {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @Permissions('assignments.update')
  @ApiOperation({
    summary:
      'Actualizar rol y/o cerrar una asignacion (end_date establece active=false)',
  })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiNotFoundResponse({ description: 'Asignacion no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberAssignmentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdResponseDto> {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('assignments.delete')
  @ApiOperation({ summary: 'Retirar una asignacion (soft delete)' })
  @ApiNoContentResponse({ description: 'Asignacion retirada' })
  @ApiNotFoundResponse({ description: 'Asignacion no encontrada' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.service.remove(id, user);
  }
}
