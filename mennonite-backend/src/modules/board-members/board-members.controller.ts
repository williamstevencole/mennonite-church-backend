import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { BoardMemberDetailResponseDto } from './dto/board-member-detail.response.dto';

@ApiTags('Board Members')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('board-members')
export class BoardMembersController {
  constructor(private readonly service: BoardMembersService) {}

  @Get(':id')
  @Permissions('assignments.read')
  @ApiOperation({ summary: 'Obtener detalle de un integrante de concilio' })
  @ApiOkResponse({ type: BoardMemberDetailResponseDto })
  @ApiNotFoundResponse({
    description: 'Integrante de concilio no encontrado',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BoardMemberDetailResponseDto> {
    return this.service.findOne(id);
  }
}
