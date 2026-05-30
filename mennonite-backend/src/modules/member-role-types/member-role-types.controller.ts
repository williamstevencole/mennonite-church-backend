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
  ApiBearerAuth,
  ApiBadRequestResponse,
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
import { CreateMemberRoleTypeDto } from './dto/create-member-role-type.dto';
import { ListMemberRoleTypesQueryDto } from './dto/list-member-role-types-query.dto';
import { MemberRoleTypeResponseDto } from './dto/member-role-type.response.dto';
import { MemberRoleTypesPageResponseDto } from './dto/member-role-types-page.response.dto';
import { UpdateMemberRoleTypeDto } from './dto/update-member-role-type.dto';
import { MemberRoleTypesService } from './member-role-types.service';
import { IdResponseDto } from '../../common/dto/id-response.dto';

@ApiTags('Member Role Types')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('member-role-types')
export class MemberRoleTypesController {
  constructor(
    private readonly memberRoleTypesService: MemberRoleTypesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('catalog.member-role-types.manage')
  @ApiOperation({ summary: 'Crear un nuevo cargo (ministry o council)' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Ya existe un cargo con ese nombre' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMemberRoleTypeDto,
  ): Promise<IdResponseDto> {
    return this.memberRoleTypesService.create(user.idChurch, dto);
  }

  @Get()
  @Permissions('catalog.member-role-types.read')
  @ApiOperation({
    summary:
      'Listar cargos activos con paginacion, opcionalmente filtrados por ambito',
  })
  @ApiOkResponse({ type: MemberRoleTypesPageResponseDto })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListMemberRoleTypesQueryDto,
  ): Promise<MemberRoleTypesPageResponseDto> {
    return this.memberRoleTypesService.findAll(user.idChurch, query);
  }

  @Get(':id')
  @Permissions('catalog.member-role-types.read')
  @ApiOperation({ summary: 'Obtener un cargo por id' })
  @ApiOkResponse({ type: MemberRoleTypeResponseDto })
  @ApiNotFoundResponse({ description: 'Cargo no encontrado' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MemberRoleTypeResponseDto> {
    return this.memberRoleTypesService.findOne(user.idChurch, id);
  }

  @Patch(':id')
  @Permissions('catalog.member-role-types.manage')
  @ApiOperation({ summary: 'Actualizar nombre o ambito de un cargo' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Ya existe un cargo con ese nombre' })
  @ApiNotFoundResponse({ description: 'Cargo no encontrado' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberRoleTypeDto,
  ): Promise<IdResponseDto> {
    return this.memberRoleTypesService.update(user.idChurch, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('catalog.member-role-types.manage')
  @ApiOperation({ summary: 'Desactivar (soft delete) un cargo' })
  @ApiNoContentResponse({ description: 'Cargo desactivado' })
  @ApiNotFoundResponse({ description: 'Cargo no encontrado' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.memberRoleTypesService.remove(user.idChurch, id);
  }
}
