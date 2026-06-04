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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { IdResponseDto } from '../../common/dto/id-response.dto';
import { FundraisingDetailsService } from './fundraising-details.service';
import { CreateFundraisingDetailDto } from './dto/create-fundraising-detail.dto';
import { UpdateFundraisingDetailDto } from './dto/update-fundraising-detail.dto';
import { ListFundraisingDetailsQueryDto } from './dto/list-fundraising-details-query.dto';
import { FundraisingDetailDetailResponseDto } from './dto/fundraising-detail-detail.response.dto';
import { FundraisingDetailsPageResponseDto } from './dto/fundraising-details-page.response.dto';

@ApiTags('Fundraising Details')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('fundraising-details')
export class FundraisingDetailsController {
  constructor(private readonly service: FundraisingDetailsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('events.create')
  @ApiOperation({ summary: 'Crear detalle de recaudacion para un evento' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({
    description:
      'Evento inexistente, fuera de la iglesia, o no es de categoria fundraising',
  })
  @ApiConflictResponse({
    description: 'El evento ya tiene un detalle de recaudacion',
  })
  create(
    @Body() dto: CreateFundraisingDetailDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdResponseDto> {
    return this.service.create(dto, user);
  }

  @Get()
  @Permissions('events.read')
  @ApiOperation({
    summary: 'Listar detalles de recaudacion (paginado, filtrable por idEvent)',
  })
  @ApiOkResponse({ type: FundraisingDetailsPageResponseDto })
  findAll(
    @Query() query: ListFundraisingDetailsQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<FundraisingDetailsPageResponseDto> {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  @Permissions('events.read')
  @ApiOperation({ summary: 'Obtener detalle de recaudacion por ID' })
  @ApiOkResponse({ type: FundraisingDetailDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Detalle de recaudacion no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<FundraisingDetailDetailResponseDto> {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @Permissions('events.update')
  @ApiOperation({
    summary: 'Actualizar targetAmount o notes del detalle de recaudacion',
  })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiNotFoundResponse({ description: 'Detalle de recaudacion no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFundraisingDetailDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdResponseDto> {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('events.delete')
  @ApiOperation({ summary: 'Eliminar detalle de recaudacion' })
  @ApiNoContentResponse({ description: 'Detalle eliminado' })
  @ApiNotFoundResponse({ description: 'Detalle de recaudacion no encontrado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.service.remove(id, user);
  }
}
