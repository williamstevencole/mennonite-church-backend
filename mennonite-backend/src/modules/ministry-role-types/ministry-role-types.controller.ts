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
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';
import { CreateMinistryRoleTypeDto } from './dto/create-ministry-role-type.dto';
import { ListMinistryRoleTypesQueryDto } from './dto/list-ministry-role-types-query.dto';
import { MinistryRoleTypeResponseDto } from './dto/ministry-role-type.response.dto';
import { MinistryRoleTypesPageResponseDto } from './dto/ministry-role-types-page.response.dto';
import { UpdateMinistryRoleTypeDto } from './dto/update-ministry-role-type.dto';
import { MinistryRoleTypesService } from './ministry-role-types.service';

@ApiTags('Ministry Role Types')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('ministry-role-types')
export class MinistryRoleTypesController {
  constructor(private readonly service: MinistryRoleTypesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('catalog.ministry-role-types.manage')
  @ApiOperation({ summary: 'Crear un cargo de ministerio' })
  @ApiCreatedResponse({ type: IdNameResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiNotFoundResponse({ description: 'Ministerio no encontrado' })
  @ApiConflictResponse({ description: 'Nombre duplicado en el ministerio' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMinistryRoleTypeDto,
  ): Promise<IdNameResponseDto> {
    return this.service.create(user.idChurch, dto);
  }

  @Get()
  @Permissions('catalog.ministry-role-types.read')
  @ApiOperation({ summary: 'Listar cargos de ministerio con paginacion' })
  @ApiOkResponse({ type: MinistryRoleTypesPageResponseDto })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListMinistryRoleTypesQueryDto,
  ): Promise<MinistryRoleTypesPageResponseDto> {
    return this.service.findAll(user.idChurch, query);
  }

  @Get(':id')
  @Permissions('catalog.ministry-role-types.read')
  @ApiOperation({ summary: 'Obtener detalle de un cargo de ministerio' })
  @ApiOkResponse({ type: MinistryRoleTypeResponseDto })
  @ApiNotFoundResponse({ description: 'Cargo no encontrado' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<MinistryRoleTypeResponseDto> {
    return this.service.findOne(user.idChurch, id, includeInactive === 'true');
  }

  @Patch(':id')
  @Permissions('catalog.ministry-role-types.manage')
  @ApiOperation({ summary: 'Actualizar nombre o estado de un cargo' })
  @ApiOkResponse({ type: IdNameResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Nombre duplicado en el ministerio' })
  @ApiNotFoundResponse({ description: 'Cargo no encontrado' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMinistryRoleTypeDto,
  ): Promise<IdNameResponseDto> {
    return this.service.update(user.idChurch, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('catalog.ministry-role-types.manage')
  @ApiOperation({ summary: 'Desactivar (soft delete) un cargo de ministerio' })
  @ApiNoContentResponse({ description: 'Cargo desactivado' })
  @ApiNotFoundResponse({ description: 'Cargo no encontrado' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.service.remove(user.idChurch, id);
  }
}
