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
import { ListMemberAssignmentsQueryDto } from './dto/list-member-assignments-query.dto';
import { MemberAssignmentDetailResponseDto } from './dto/member-assignment-detail.response.dto';
import { MemberAssignmentsPageResponseDto } from './dto/member-assignments-page.response.dto';
import { MemberAssignmentsService } from './member-assignments.service';

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
  @ApiOperation({ summary: 'Listar asignaciones de miembros' })
  @ApiOkResponse({ type: MemberAssignmentsPageResponseDto })
  findAll(
    @Query() query: ListMemberAssignmentsQueryDto,
  ): Promise<MemberAssignmentsPageResponseDto> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions('assignments.read')
  @ApiOperation({ summary: 'Obtener detalle de una asignacion' })
  @ApiOkResponse({ type: MemberAssignmentDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Asignacion no encontrada' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MemberAssignmentDetailResponseDto> {
    return this.service.findOne(id);
  }
}
