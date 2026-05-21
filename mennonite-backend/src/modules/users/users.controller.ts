import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserResponseDto } from './dto/create-user.response.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UserDetailResponseDto } from './dto/user-detail.response.dto';
import { UsersPageResponseDto } from './dto/users-page.response.dto';
import { UsersService } from './users.service';

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
  @Permissions('users.write')
  @ApiOperation({ summary: 'Crear un usuario con rol inicial' })
  @ApiCreatedResponse({ type: CreateUserResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido o rol inexistente' })
  @ApiConflictResponse({ description: 'Email duplicado' })
  create(@Body() dto: CreateUserDto): Promise<CreateUserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get(':id')
  @Permissions('users.read')
  @ApiOperation({ summary: 'Obtener detalle de usuario' })
  @ApiOkResponse({ type: UserDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserDetailResponseDto> {
    return this.usersService.findOne(id);
  }
}
