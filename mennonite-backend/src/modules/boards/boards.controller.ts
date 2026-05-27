import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
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
import { BoardDetailResponseDto } from './dto/board-detail.response.dto';
import { BoardListItemResponseDto } from './dto/board-list-item.response.dto';
import { ListBoardsQueryDto } from './dto/list-boards-query.dto';
import { BoardsService } from './boards.service';

@ApiTags('Boards')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('boards')
export class BoardsController {
  constructor(private readonly service: BoardsService) {}

  @Get()
  @Permissions('boards.read')
  @ApiOperation({ summary: 'Listar concilios de la iglesia' })
  @ApiOkResponse({ type: BoardListItemResponseDto, isArray: true })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListBoardsQueryDto,
  ): Promise<BoardListItemResponseDto[]> {
    return this.service.findAll(user, query);
  }

  @Get(':id')
  @Permissions('boards.read')
  @ApiOperation({ summary: 'Obtener detalle de un concilio' })
  @ApiOkResponse({ type: BoardDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Concilio no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<BoardDetailResponseDto> {
    return this.service.findOne(id, user);
  }
}
