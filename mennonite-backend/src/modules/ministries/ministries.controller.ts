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
import { CreateMinistryDto } from './dto/create-ministry.dto';
import { ListMinistriesQueryDto } from './dto/list-ministries-query.dto';
import { MinistriesPageResponseDto } from './dto/ministries-page.response.dto';
import { MinistryDetailResponseDto } from './dto/ministry-detail.response.dto';
import { UpdateMinistryDto } from './dto/update-ministry.dto';
import { MinistriesService } from './ministries.service';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';

@ApiTags('Ministries')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('ministries')
export class MinistriesController {
  constructor(private readonly ministriesService: MinistriesService) {}

  @Get()
  @Permissions('ministries.read')
  @ApiOperation({ summary: 'Listar ministerios con filtros y paginacion' })
  @ApiOkResponse({ type: MinistriesPageResponseDto })
  findAll(
    @Query() query: ListMinistriesQueryDto,
  ): Promise<MinistriesPageResponseDto> {
    return this.ministriesService.findAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('ministries.create')
  @ApiOperation({ summary: 'Crear un ministerio en la iglesia del usuario' })
  @ApiCreatedResponse({ type: IdNameResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido o lider inexistente',
  })
  @ApiConflictResponse({ description: 'Codigo de ministerio duplicado' })
  create(
    @Body() dto: CreateMinistryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdNameResponseDto> {
    return this.ministriesService.create(dto, user);
  }

  @Patch(':id')
  @Permissions('ministries.update')
  @ApiOperation({ summary: 'Actualizar datos de un ministerio' })
  @ApiOkResponse({ type: IdNameResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido o lider inexistente',
  })
  @ApiNotFoundResponse({ description: 'Ministerio no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMinistryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdNameResponseDto> {
    return this.ministriesService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('ministries.delete')
  @ApiOperation({ summary: 'Retirar un ministerio (soft delete)' })
  @ApiNoContentResponse({ description: 'Ministerio retirado' })
  @ApiNotFoundResponse({ description: 'Ministerio no encontrado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.ministriesService.remove(id, user);
  }

  @Get(':id')
  @Permissions('ministries.read')
  @ApiOperation({ summary: 'Obtener detalle de un ministerio' })
  @ApiOkResponse({ type: MinistryDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Ministerio no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<MinistryDetailResponseDto> {
    return this.ministriesService.findOne(id, user, includeInactive === 'true');
  }
}
