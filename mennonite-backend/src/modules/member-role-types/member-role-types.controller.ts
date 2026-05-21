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
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateMemberRoleTypeDto } from './dto/create-member-role-type.dto';
import { ListMemberRoleTypesQueryDto } from './dto/list-member-role-types-query.dto';
import { MemberRoleTypeResponseDto } from './dto/member-role-type.response.dto';
import { UpdateMemberRoleTypeDto } from './dto/update-member-role-type.dto';
import { MemberRoleTypesService } from './member-role-types.service';

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
  @ApiCreatedResponse({ type: MemberRoleTypeResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Ya existe un cargo con ese nombre' })
  create(
    @Body() dto: CreateMemberRoleTypeDto,
  ): Promise<MemberRoleTypeResponseDto> {
    return this.memberRoleTypesService.create(dto);
  }

  @Get()
  @Permissions('catalog.member-role-types.read')
  @ApiOperation({
    summary: 'Listar cargos activos, opcionalmente filtrados por ambito',
  })
  @ApiOkResponse({ type: MemberRoleTypeResponseDto, isArray: true })
  findAll(
    @Query() query: ListMemberRoleTypesQueryDto,
  ): Promise<MemberRoleTypeResponseDto[]> {
    return this.memberRoleTypesService.findAll(query);
  }

  @Get(':id')
  @Permissions('catalog.member-role-types.read')
  @ApiOperation({ summary: 'Obtener un cargo por id' })
  @ApiOkResponse({ type: MemberRoleTypeResponseDto })
  @ApiNotFoundResponse({ description: 'Cargo no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MemberRoleTypeResponseDto> {
    return this.memberRoleTypesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('catalog.member-role-types.manage')
  @ApiOperation({ summary: 'Actualizar nombre o ambito de un cargo' })
  @ApiOkResponse({ type: MemberRoleTypeResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Ya existe un cargo con ese nombre' })
  @ApiNotFoundResponse({ description: 'Cargo no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberRoleTypeDto,
  ): Promise<MemberRoleTypeResponseDto> {
    return this.memberRoleTypesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('catalog.member-role-types.manage')
  @ApiOperation({ summary: 'Desactivar (soft delete) un cargo' })
  @ApiNoContentResponse({ description: 'Cargo desactivado' })
  @ApiNotFoundResponse({ description: 'Cargo no encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.memberRoleTypesService.remove(id);
  }
}
