import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
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

import { PastorsService } from './pastors.service';
import { ListPastorsQueryDto } from './dto/list-pastors-query.dto';
import { PastorListItemResponseDto } from './dto/pastor-list-item.response.dto';

@ApiTags('Pastors')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pastors')
export class PastorsController {
  constructor(private readonly service: PastorsService) {}

  @Get()
  @Permissions('boards.read')
  @ApiOperation({
    summary: 'Obtener pastores y co-pastores del concilio activo',
  })
  @ApiOkResponse({
    type: PastorListItemResponseDto,
    isArray: true,
  })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListPastorsQueryDto,
  ): Promise<PastorListItemResponseDto[]> {
    return this.service.findAll(user, query);
  }
}
