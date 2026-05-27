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
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { BoardMembersService } from './board-members.service';
import { BoardMemberListItemResponseDto } from './dto/board-member-list-item.response.dto';
import { ListBoardMembersQueryDto } from './dto/list-board-members-query.dto';

@ApiTags('Boards')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('boards')
export class BoardsMembersController {
  constructor(private readonly service: BoardMembersService) {}

  @Get(':boardId/members')
  @Permissions('assignments.read')
  @ApiOperation({ summary: 'Listar integrantes de un concilio con sus roles' })
  @ApiOkResponse({ type: BoardMemberListItemResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Concilio no encontrado' })
  findMembers(
    @Param('boardId', ParseIntPipe) boardId: number,
    @Query() query: ListBoardMembersQueryDto,
  ): Promise<BoardMemberListItemResponseDto[]> {
    return this.service.findByBoard(boardId, query);
  }
}
