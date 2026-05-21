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
