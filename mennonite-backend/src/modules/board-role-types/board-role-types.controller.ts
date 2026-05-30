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
import { BoardRoleTypesService } from './board-role-types.service';
import { CreateBoardRoleTypeDto } from './dto/create-board-role-type.dto';
import { ListBoardRoleTypesQueryDto } from './dto/list-board-role-types-query.dto';
import { BoardRoleTypeResponseDto } from './dto/board-role-type.response.dto';
import { BoardRoleTypesPageResponseDto } from './dto/board-role-types-page.response.dto';
import { UpdateBoardRoleTypeDto } from './dto/update-board-role-type.dto';

@ApiTags('Board Role Types')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('board-role-types')
export class BoardRoleTypesController {
  constructor(private readonly service: BoardRoleTypesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('catalog.board-role-types.manage')
  @ApiOperation({ summary: 'Crear un cargo de concilio' })
  @ApiCreatedResponse({ type: IdNameResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiNotFoundResponse({ description: 'Concilio no encontrado' })
  @ApiConflictResponse({ description: 'Nombre duplicado en el concilio' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBoardRoleTypeDto,
  ): Promise<IdNameResponseDto> {
    return this.service.create(user.idChurch, dto);
  }

  @Get()
  @Permissions('catalog.board-role-types.read')
  @ApiOperation({ summary: 'Listar cargos de concilio con paginacion' })
  @ApiOkResponse({ type: BoardRoleTypesPageResponseDto })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListBoardRoleTypesQueryDto,
  ): Promise<BoardRoleTypesPageResponseDto> {
    return this.service.findAll(user.idChurch, query);
  }

  @Get(':id')
  @Permissions('catalog.board-role-types.read')
  @ApiOperation({ summary: 'Obtener detalle de un cargo de concilio' })
  @ApiOkResponse({ type: BoardRoleTypeResponseDto })
  @ApiNotFoundResponse({ description: 'Cargo no encontrado' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<BoardRoleTypeResponseDto> {
    return this.service.findOne(user.idChurch, id, includeInactive === 'true');
  }

  @Patch(':id')
  @Permissions('catalog.board-role-types.manage')
  @ApiOperation({ summary: 'Actualizar nombre o estado de un cargo' })
  @ApiOkResponse({ type: IdNameResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Nombre duplicado en el concilio' })
  @ApiNotFoundResponse({ description: 'Cargo no encontrado' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBoardRoleTypeDto,
  ): Promise<IdNameResponseDto> {
    return this.service.update(user.idChurch, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('catalog.board-role-types.manage')
  @ApiOperation({ summary: 'Desactivar (soft delete) un cargo de concilio' })
  @ApiNoContentResponse({ description: 'Cargo desactivado' })
  @ApiNotFoundResponse({ description: 'Cargo no encontrado' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.service.remove(user.idChurch, id);
  }
}
