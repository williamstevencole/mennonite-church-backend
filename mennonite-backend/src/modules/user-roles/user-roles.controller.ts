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
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { ListUserRolesQueryDto } from './dto/list-user-roles-query.dto';
import { UserRoleResponseDto } from './dto/user-role.response.dto';
import { UserRolesPageResponseDto } from './dto/user-roles-page.response.dto';
import { SetUserRolePermissionsDto } from './dto/set-user-role-permissions.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserRolesService } from './user-roles.service';
import { IdResponseDto } from '../../common/dto/id-response.dto';

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
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido o permisos inexistentes',
  })
  @ApiConflictResponse({ description: 'Nombre duplicado' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateUserRoleDto,
  ): Promise<IdResponseDto> {
    return this.service.create(user.idChurch, dto);
  }

  @Get()
  @Permissions('user-roles.read')
  @ApiOperation({ summary: 'Listar roles con paginacion' })
  @ApiOkResponse({ type: UserRolesPageResponseDto })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListUserRolesQueryDto,
  ): Promise<UserRolesPageResponseDto> {
    return this.service.findAll(user.idChurch, query);
  }

  @Get(':id')
  @Permissions('user-roles.read')
  @ApiOperation({ summary: 'Obtener un rol por id' })
  @ApiOkResponse({ type: UserRoleResponseDto })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserRoleResponseDto> {
    return this.service.findOne(user.idChurch, id);
  }

  @Patch(':id')
  @Permissions('user-roles.update')
  @ApiOperation({ summary: 'Actualizar nombre o descripcion de un rol' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido o permisos inexistentes',
  })
  @ApiConflictResponse({ description: 'Nombre duplicado' })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<IdResponseDto> {
    return this.service.update(user.idChurch, id, dto);
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
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetUserRolePermissionsDto,
  ): Promise<UserRoleResponseDto> {
    return this.service.setPermissions(user.idChurch, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('user-roles.delete')
  @ApiOperation({ summary: 'Dar de baja un rol' })
  @ApiNoContentResponse({ description: 'Rol dado de baja' })
  @ApiConflictResponse({ description: 'Hay usuarios con este rol' })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.service.remove(user.idChurch, id);
  }
}
