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
import { CreateMinistryMemberDto } from './dto/create-ministry-member.dto';
import { ListMinistryMembersQueryDto } from './dto/list-ministry-members-query.dto';
import { MinistryMemberDetailResponseDto } from './dto/ministry-member-detail.response.dto';
import { MinistryMembersPageResponseDto } from './dto/ministry-members-page.response.dto';
import { UpdateMinistryMemberDto } from './dto/update-ministry-member.dto';
import { MinistryMembersService } from './ministry-members.service';

@ApiTags('Ministry Members')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('ministry-members')
export class MinistryMembersController {
  constructor(private readonly service: MinistryMembersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('assignments.create')
  @ApiOperation({ summary: 'Asignar un miembro a un ministerio' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido o FK inexistente' })
  @ApiConflictResponse({ description: 'Miembro ya asignado al ministerio' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMinistryMemberDto,
  ): Promise<IdResponseDto> {
    return this.service.create(user, dto);
  }

  @Get()
  @Permissions('assignments.read')
  @ApiOperation({
    summary: 'Listar integrantes de ministerios con filtros y paginacion',
  })
  @ApiOkResponse({ type: MinistryMembersPageResponseDto })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListMinistryMembersQueryDto,
  ): Promise<MinistryMembersPageResponseDto> {
    return this.service.findAll(user, query);
  }

  @Get(':id')
  @Permissions('assignments.read')
  @ApiOperation({ summary: 'Obtener detalle de un integrante de ministerio' })
  @ApiOkResponse({ type: MinistryMemberDetailResponseDto })
  @ApiNotFoundResponse({
    description: 'Integrante de ministerio no encontrado',
  })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<MinistryMemberDetailResponseDto> {
    return this.service.findOne(user, id, includeInactive === 'true');
  }

  @Patch(':id')
  @Permissions('assignments.update')
  @ApiOperation({ summary: 'Actualizar rol o fechas de un integrante' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido o FK inexistente' })
  @ApiNotFoundResponse({
    description: 'Integrante de ministerio no encontrado',
  })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMinistryMemberDto,
  ): Promise<IdResponseDto> {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('assignments.delete')
  @ApiOperation({
    summary: 'Retirar integrante de ministerio (soft delete)',
  })
  @ApiNoContentResponse({ description: 'Integrante de ministerio retirado' })
  @ApiNotFoundResponse({
    description: 'Integrante de ministerio no encontrado',
  })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.service.remove(user, id);
  }
}
