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
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { ListPermissionsQueryDto } from './dto/list-permissions-query.dto';
import { PermissionResponseDto } from './dto/permission.response.dto';
import { PermissionsPageResponseDto } from './dto/permissions-page.response.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsService } from './permissions.service';
import { IdResponseDto } from '../../common/dto/id-response.dto';

@ApiTags('Permissions')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('user-roles.update')
  @ApiOperation({ summary: 'Crear un permiso nuevo' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Code duplicado' })
  create(@Body() dto: CreatePermissionDto): Promise<IdResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @Permissions('permissions.read')
  @ApiOperation({ summary: 'Listar permisos con paginacion' })
  @ApiOkResponse({ type: PermissionsPageResponseDto })
  findAll(
    @Query() query: ListPermissionsQueryDto,
  ): Promise<PermissionsPageResponseDto> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions('permissions.read')
  @ApiOperation({ summary: 'Obtener un permiso por id' })
  @ApiOkResponse({ type: PermissionResponseDto })
  @ApiNotFoundResponse({ description: 'Permiso no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<PermissionResponseDto> {
    return this.service.findOne(id, includeInactive === 'true');
  }

  @Patch(':id')
  @Permissions('user-roles.update')
  @ApiOperation({ summary: 'Actualizar un permiso' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiNotFoundResponse({ description: 'Permiso no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
  ): Promise<IdResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('user-roles.update')
  @ApiOperation({ summary: 'Dar de baja un permiso' })
  @ApiNoContentResponse({ description: 'Permiso dado de baja' })
  @ApiConflictResponse({ description: 'Permiso asignado a roles' })
  @ApiNotFoundResponse({ description: 'Permiso no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
