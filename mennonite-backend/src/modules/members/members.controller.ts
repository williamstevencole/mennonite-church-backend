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
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberCreatedResponseDto } from './dto/member-created.response.dto';
import { MemberDetailResponseDto } from './dto/member-detail.response.dto';
import { MembersPageResponseDto } from './dto/members-page.response.dto';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { ListMembersQueryDto } from './dto/list-members-query.dto';

@ApiTags('Members')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('members.create')
  @ApiOperation({ summary: 'Crear un miembro' })
  @ApiCreatedResponse({ type: MemberCreatedResponseDto })
  @ApiBadRequestResponse({
    description: 'Formato o payload invalido',
  })
  @ApiConflictResponse({ description: 'Miembro duplicado' })
  create(
    @Body() createMemberDto: CreateMemberDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<MemberCreatedResponseDto> {
    return this.membersService.create(createMemberDto, user);
  }

  @Get()
  @Permissions('members.read')
  @ApiOperation({ summary: 'Listar miembros' })
  @ApiOkResponse({ type: MembersPageResponseDto })
  findAll(
    @Query() query: ListMembersQueryDto,
  ): Promise<MembersPageResponseDto> {
    return this.membersService.findAll(query);
  }

  @Patch(':id')
  @Permissions('members.update')
  @ApiOperation({ summary: 'Actualizar un miembro' })
  @ApiOkResponse({ type: MemberDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Miembro no encontrado' })
  @ApiConflictResponse({ description: 'Miembro duplicado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMemberDto: UpdateMemberDto,
  ): Promise<MemberDetailResponseDto> {
    return this.membersService.update(id, updateMemberDto);
  }

  @Get(':id')
  @Permissions('members.read')
  @ApiOperation({ summary: 'Obtener detalle de miembro' })
  @ApiOkResponse({ type: MemberDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Miembro no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MemberDetailResponseDto> {
    return this.membersService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('members.delete')
  @ApiOperation({ summary: 'Dar de baja un miembro (soft delete)' })
  @ApiNoContentResponse({ description: 'Miembro dado de baja' })
  @ApiNotFoundResponse({ description: 'Miembro no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.membersService.remove(id);
  }
}
