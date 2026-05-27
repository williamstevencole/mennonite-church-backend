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
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { BoardMembersService } from './board-members.service';
import { BoardMemberCreatedResponseDto } from './dto/board-member-created.response.dto';
import { BoardMemberDetailResponseDto } from './dto/board-member-detail.response.dto';
import { CreateBoardMemberDto } from './dto/create-board-member.dto';
import { UpdateBoardMemberDto } from './dto/update-board-member.dto';

@ApiTags('Board Members')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('board-members')
export class BoardMembersController {
  constructor(private readonly service: BoardMembersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('assignments.create')
  @ApiOperation({ summary: 'Registrar un integrante de concilio' })
  @ApiCreatedResponse({ type: BoardMemberCreatedResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido o FK inexistente' })
  @ApiConflictResponse({ description: 'Rol unico duplicado en el concilio' })
  create(
    @Body() dto: CreateBoardMemberDto,
  ): Promise<BoardMemberCreatedResponseDto> {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissions('assignments.update')
  @ApiOperation({ summary: 'Actualizar rol o fechas de un integrante' })
  @ApiOkResponse({ type: BoardMemberDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido o FK inexistente' })
  @ApiConflictResponse({ description: 'Rol unico duplicado en el concilio' })
  @ApiNotFoundResponse({ description: 'Integrante de concilio no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBoardMemberDto,
  ): Promise<BoardMemberDetailResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('assignments.delete')
  @ApiOperation({ summary: 'Retirar integrante de concilio (soft delete)' })
  @ApiNoContentResponse({ description: 'Integrante de concilio retirado' })
  @ApiNotFoundResponse({
    description: 'Integrante de concilio no encontrado',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }

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
