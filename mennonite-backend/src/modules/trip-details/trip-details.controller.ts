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

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

import { TripDetailsService } from './trip-details.service';
import { CreateTripDetailDto } from './dto/create-trip-detail.dto';
import { TripDetailListResponseDto } from './dto/trip-detail-list-response.dto';
import { TripDetailResponseDto } from './dto/trip-detail-response.dto';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { IdResponseDto } from '../../common/dto/id-response.dto';

@ApiTags('Trip Details')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('trip-details')
export class TripDetailsController {
  constructor(private readonly service: TripDetailsService) {}

  @Get()
  @Permissions('events.read')
  @ApiOperation({ summary: 'Listar trip details con paginación' })
  @ApiOkResponse({ type: TripDetailListResponseDto })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationQueryDto,
  ): Promise<TripDetailListResponseDto> {
    return this.service.findAll(user, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('events.create')
  @ApiOperation({ summary: 'Crear trip detail para un evento tipo trip' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({
    description: 'Evento inválido o no es tipo trip',
  })
  @ApiConflictResponse({
    description: 'El evento ya tiene trip details',
  })
  create(
    @Body() dto: CreateTripDetailDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdResponseDto> {
    return this.service.create(dto, user);
  }

  @Get(':id')
  @Permissions('events.read')
  @ApiOperation({ summary: 'Obtener detalle de un trip detail' })
  @ApiOkResponse({ type: TripDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Trip detail no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<TripDetailResponseDto> {
    return this.service.findOne(id, user);
  }
}
