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
import { IdResponseDto } from '../../common/dto/id-response.dto';
import { CreatePeriodClosureDto } from './dto/create-period-closure.dto';
import { ListPeriodClosuresQueryDto } from './dto/list-period-closures-query.dto';
import { PeriodClosureResponseDto } from './dto/period-closure.response.dto';
import { PeriodClosuresPageResponseDto } from './dto/period-closures-page.response.dto';
import { UpdatePeriodClosureDto } from './dto/update-period-closure.dto';
import { PeriodClosuresService } from './period-closures.service';

@ApiTags('Period Closures')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('period-closures')
export class PeriodClosuresController {
  constructor(private readonly service: PeriodClosuresService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('period-closures.create')
  @ApiOperation({ summary: 'Registrar cierre anual de período' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido o montos negativos' })
  @ApiConflictResponse({ description: 'Ya existe un cierre para ese año' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePeriodClosureDto,
  ): Promise<IdResponseDto> {
    return this.service.create(user.idChurch, user.sub, dto);
  }

  @Get()
  @Permissions('period-closures.read')
  @ApiOperation({ summary: 'Listar cierres anuales paginados' })
  @ApiOkResponse({ type: PeriodClosuresPageResponseDto })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListPeriodClosuresQueryDto,
  ): Promise<PeriodClosuresPageResponseDto> {
    return this.service.findAll(user.idChurch, query);
  }

  @Get(':id')
  @Permissions('period-closures.read')
  @ApiOperation({ summary: 'Obtener detalle de un cierre anual' })
  @ApiOkResponse({ type: PeriodClosureResponseDto })
  @ApiNotFoundResponse({ description: 'Cierre no encontrado' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PeriodClosureResponseDto> {
    return this.service.findOne(user.idChurch, id);
  }

  @Patch(':id')
  @Permissions('period-closures.update')
  @ApiOperation({ summary: 'Actualizar saldos o año de un cierre' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Año duplicado con otro cierre' })
  @ApiNotFoundResponse({ description: 'Cierre no encontrado' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePeriodClosureDto,
  ): Promise<IdResponseDto> {
    return this.service.update(user.idChurch, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('period-closures.delete')
  @ApiOperation({ summary: 'Eliminar un cierre anual' })
  @ApiNoContentResponse({ description: 'Cierre eliminado' })
  @ApiNotFoundResponse({ description: 'Cierre no encontrado' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.service.remove(user.idChurch, id);
  }
}
