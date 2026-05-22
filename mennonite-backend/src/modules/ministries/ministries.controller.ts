import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateMinistryDto } from './dto/create-ministry.dto';
import { ListMinistriesQueryDto } from './dto/list-ministries-query.dto';
import { MinistriesPageResponseDto } from './dto/ministries-page.response.dto';
import { MinistryCreatedResponseDto } from './dto/ministry-created.response.dto';
import { MinistriesService } from './ministries.service';

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
  @ApiCreatedResponse({ type: MinistryCreatedResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido o lider inexistente',
  })
  @ApiConflictResponse({ description: 'Codigo de ministerio duplicado' })
  create(
    @Body() dto: CreateMinistryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<MinistryCreatedResponseDto> {
    return this.ministriesService.create(dto, user);
  }
}
