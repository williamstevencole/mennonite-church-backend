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
import { BoardMembersService } from '../board-members/board-members.service';
import { BoardMembersPageResponseDto } from '../board-members/dto/board-members-page.response.dto';
import { ListBoardMembersQueryDto } from '../board-members/dto/list-board-members-query.dto';
import { BoardDetailResponseDto } from './dto/board-detail.response.dto';
import { BoardsPageResponseDto } from './dto/boards-page.response.dto';
import { CreateBoardDto } from './dto/create-board.dto';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';
import { ListBoardsQueryDto } from './dto/list-boards-query.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardsService } from './boards.service';

@ApiTags('Boards')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('boards')
export class BoardsController {
  constructor(
    private readonly service: BoardsService,
    private readonly boardMembersService: BoardMembersService,
  ) {}

  @Get()
  @Permissions('boards.read')
  @ApiOperation({ summary: 'Listar concilios de la iglesia con paginacion' })
  @ApiOkResponse({ type: BoardsPageResponseDto })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListBoardsQueryDto,
  ): Promise<BoardsPageResponseDto> {
    return this.service.findAll(user, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('boards.create')
  @ApiOperation({ summary: 'Crear un nuevo concilio' })
  @ApiCreatedResponse({ type: IdNameResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Ya existe un concilio activo' })
  create(
    @Body() dto: CreateBoardDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdNameResponseDto> {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Permissions('boards.update')
  @ApiOperation({ summary: 'Actualizar datos de un concilio' })
  @ApiOkResponse({ type: IdNameResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Ya existe un concilio activo' })
  @ApiNotFoundResponse({ description: 'Concilio no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBoardDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdNameResponseDto> {
    return this.service.update(id, dto, user);
  }

  @Get(':id/members')
  @Permissions('assignments.read')
  @ApiOperation({ summary: 'Listar integrantes de un concilio con paginacion' })
  @ApiOkResponse({ type: BoardMembersPageResponseDto })
  @ApiNotFoundResponse({ description: 'Concilio no encontrado' })
  findMembers(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListBoardMembersQueryDto,
  ): Promise<BoardMembersPageResponseDto> {
    return this.boardMembersService.findByBoard(user.idChurch, id, query);
  }

  @Get(':id')
  @Permissions('boards.read')
  @ApiOperation({ summary: 'Obtener detalle de un concilio' })
  @ApiOkResponse({ type: BoardDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Concilio no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<BoardDetailResponseDto> {
    return this.service.findOne(id, user, includeInactive === 'true');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('boards.delete')
  @ApiOperation({ summary: 'Retirar un concilio (soft delete)' })
  @ApiNoContentResponse({ description: 'Concilio retirado' })
  @ApiNotFoundResponse({ description: 'Concilio no encontrado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.service.remove(id, user);
  }
}
