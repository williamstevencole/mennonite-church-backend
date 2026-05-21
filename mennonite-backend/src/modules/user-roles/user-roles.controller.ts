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
  Put,
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
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { UserRoleResponseDto } from './dto/user-role.response.dto';
import { SetUserRolePermissionsDto } from './dto/set-user-role-permissions.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserRolesService } from './user-roles.service';

@ApiTags('User Roles')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('user-roles')
export class UserRolesController {
  constructor(private readonly service: UserRolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('user-roles.create')
  @ApiOperation({ summary: 'Crear un rol (opcionalmente con permisos)' })
  @ApiCreatedResponse({ type: UserRoleResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido o permisos inexistentes',
  })
  @ApiConflictResponse({ description: 'Nombre duplicado' })
  create(@Body() dto: CreateUserRoleDto): Promise<UserRoleResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @Permissions('user-roles.read')
  @ApiOperation({ summary: 'Listar todos los roles' })
  @ApiOkResponse({ type: UserRoleResponseDto, isArray: true })
  findAll(): Promise<UserRoleResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @Permissions('user-roles.read')
  @ApiOperation({ summary: 'Obtener un rol por id' })
  @ApiOkResponse({ type: UserRoleResponseDto })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserRoleResponseDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('user-roles.update')
  @ApiOperation({ summary: 'Actualizar nombre o descripcion de un rol' })
  @ApiOkResponse({ type: UserRoleResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido o permisos inexistentes',
  })
  @ApiConflictResponse({ description: 'Nombre duplicado' })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<UserRoleResponseDto> {
    return this.service.update(id, dto);
  }

  @Put(':id/permissions')
  @Permissions('user-roles.update')
  @ApiOperation({
    summary: 'Reemplazar la lista completa de permisos del rol',
  })
  @ApiOkResponse({ type: UserRoleResponseDto })
  @ApiBadRequestResponse({ description: 'Permisos inexistentes' })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  setPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetUserRolePermissionsDto,
  ): Promise<UserRoleResponseDto> {
    return this.service.setPermissions(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('user-roles.delete')
  @ApiOperation({ summary: 'Dar de baja un rol' })
  @ApiNoContentResponse({ description: 'Rol dado de baja' })
  @ApiConflictResponse({ description: 'Hay usuarios con este rol' })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
