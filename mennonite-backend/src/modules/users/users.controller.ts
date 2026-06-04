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
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDetailResponseDto } from './dto/user-detail.response.dto';
import { UsersPageResponseDto } from './dto/users-page.response.dto';
import { UsersService } from './users.service';
import { IdResponseDto } from '../../common/dto/id-response.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('users.read')
  @ApiOperation({ summary: 'Listar usuarios con filtros y paginacion' })
  @ApiOkResponse({ type: UsersPageResponseDto })
  findAll(@Query() query: ListUsersQueryDto): Promise<UsersPageResponseDto> {
    return this.usersService.findAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('users.create')
  @ApiOperation({ summary: 'Crear un usuario con rol inicial' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido o rol inexistente' })
  @ApiConflictResponse({ description: 'Email duplicado' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateUserDto,
  ): Promise<IdResponseDto> {
    return this.usersService.create(user.idChurch, dto);
  }

  @Patch(':id')
  @Permissions('users.update')
  @ApiOperation({ summary: 'Actualizar datos del usuario' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiConflictResponse({ description: 'Email duplicado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<IdResponseDto> {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/role')
  @Permissions('users.update')
  @ApiOperation({ summary: 'Asignar un rol a un usuario' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({
    description: 'Rol inexistente o no pertenece a tu iglesia',
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  assignRole(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignUserRoleDto,
  ): Promise<IdResponseDto> {
    return this.usersService.assignRole(user.idChurch, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('users.delete')
  @ApiOperation({ summary: 'Desactivar usuario (soft delete)' })
  @ApiNoContentResponse({ description: 'Usuario desactivado' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }

  @Get(':id')
  @Permissions('users.read')
  @ApiOperation({ summary: 'Obtener detalle de usuario' })
  @ApiOkResponse({ type: UserDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<UserDetailResponseDto> {
    return this.usersService.findOne(id, includeInactive === 'true');
  }
}
