import {
  Controller,
  HttpCode,
  HttpStatus,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberDetailResponseDto } from './dto/member-detail.response.dto';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';
import { MembersPageResponseDto } from './dto/members-page.response.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';

@ApiTags('Members')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @Permissions('members.read')
  @ApiOperation({ summary: 'Listar miembros con filtros y paginacion' })
  @ApiOkResponse({ type: MembersPageResponseDto })
  findAll(
    @Query() query: ListMembersQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<MembersPageResponseDto> {
    return this.membersService.findAll(query, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('members.create')
  @ApiOperation({ summary: 'Crear un miembro en la iglesia del usuario' })
  @ApiCreatedResponse({ type: IdNameResponseDto })
  @ApiBadRequestResponse({ description: 'Formato o payload invalido' })
  @ApiConflictResponse({ description: 'Miembro duplicado' })
  create(
    @Body() createMemberDto: CreateMemberDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdNameResponseDto> {
    return this.membersService.create(createMemberDto, user);
  }

  @Patch(':id')
  @Permissions('members.update')
  @ApiOperation({ summary: 'Actualizar un miembro' })
  @ApiOkResponse({ type: IdNameResponseDto })
  @ApiNotFoundResponse({ description: 'Miembro no encontrado' })
  @ApiConflictResponse({ description: 'Miembro duplicado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMemberDto: UpdateMemberDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdNameResponseDto> {
    return this.membersService.update(id, updateMemberDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('members.delete')
  @ApiOperation({ summary: 'Dar de baja un miembro (soft delete)' })
  @ApiNoContentResponse({ description: 'Miembro dado de baja' })
  @ApiNotFoundResponse({ description: 'Miembro no encontrado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.membersService.remove(id, user);
  }

  @Get(':id')
  @Permissions('members.read')
  @ApiOperation({ summary: 'Obtener detalle de miembro' })
  @ApiOkResponse({ type: MemberDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Miembro no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<MemberDetailResponseDto> {
    return this.membersService.findOne(id, user, includeInactive === 'true');
  }
}
