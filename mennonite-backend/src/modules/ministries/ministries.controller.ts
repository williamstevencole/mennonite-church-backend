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
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateMinistryMemberDto } from './dto/create-ministry-member.dto';
import { CreateMinistryDto } from './dto/create-ministry.dto';
import { ListMinistriesQueryDto } from './dto/list-ministries-query.dto';
import { MinistriesPageResponseDto } from './dto/ministries-page.response.dto';
import { MinistryCreatedResponseDto } from './dto/ministry-created.response.dto';
import { MinistryDetailResponseDto } from './dto/ministry-detail.response.dto';
import { MinistryMemberCreatedResponseDto } from './dto/ministry-member-created.response.dto';
import { MinistryResponseDto } from './dto/ministry.response.dto';
import { UpdateMinistryDto } from './dto/update-ministry.dto';
import { MinistriesService } from './ministries.service';

@ApiTags('Ministries')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('ministries')
export class MinistriesController {
  constructor(private readonly ministriesService: MinistriesService) {}

  @Get()
  @Permissions('ministries.read')
  @ApiOperation({ summary: 'Listar ministerios con filtros y paginacion' })
  @ApiOkResponse({ type: MinistriesPageResponseDto })
  findAll(
    @Query() query: ListMinistriesQueryDto,
  ): Promise<MinistriesPageResponseDto> {
    return this.ministriesService.findAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('ministries.create')
  @ApiOperation({ summary: 'Crear un ministerio en la iglesia del usuario' })
  @ApiCreatedResponse({ type: MinistryCreatedResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido o lider inexistente',
  })
  @ApiConflictResponse({ description: 'Codigo de ministerio duplicado' })
  create(
    @Body() dto: CreateMinistryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<MinistryCreatedResponseDto> {
    return this.ministriesService.create(dto, user);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('assignments.create')
  @ApiOperation({ summary: 'Asignar un miembro a un ministerio' })
  @ApiCreatedResponse({ type: MinistryMemberCreatedResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido o FK inexistente' })
  @ApiConflictResponse({ description: 'Miembro ya asignado al ministerio' })
  addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMinistryMemberDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<MinistryMemberCreatedResponseDto> {
    return this.ministriesService.addMember(id, dto, user);
  }

  @Patch(':id')
  @Permissions('ministries.update')
  @ApiOperation({ summary: 'Actualizar datos de un ministerio' })
  @ApiOkResponse({ type: MinistryResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido o lider inexistente',
  })
  @ApiNotFoundResponse({ description: 'Ministerio no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMinistryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<MinistryResponseDto> {
    return this.ministriesService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('ministries.delete')
  @ApiOperation({ summary: 'Retirar un ministerio (soft delete)' })
  @ApiNoContentResponse({ description: 'Ministerio retirado' })
  @ApiNotFoundResponse({ description: 'Ministerio no encontrado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.ministriesService.remove(id, user);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('assignments.delete')
  @ApiOperation({ summary: 'Retirar miembro de un ministerio' })
  @ApiNoContentResponse({ description: 'Miembro retirado del ministerio' })
  @ApiNotFoundResponse({ description: 'Asignacion no encontrada' })
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.ministriesService.removeMember(id, memberId, user);
  }

  @Get(':id')
  @Permissions('ministries.read')
  @ApiOperation({ summary: 'Obtener detalle de un ministerio' })
  @ApiOkResponse({ type: MinistryDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Ministerio no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<MinistryDetailResponseDto> {
    return this.ministriesService.findOne(id, user);
  }
}
