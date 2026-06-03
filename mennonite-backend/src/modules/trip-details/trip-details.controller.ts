import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TripDetailsService } from './trip-details.service';
import { CreateTripDetailDto } from './dto/create-trip-detail.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { IdResponseDto } from '../../common/dto/id-response.dto';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Trip Details')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@Controller('trip-details')
export class TripDetailsController {
  constructor(private readonly service: TripDetailsService) {}

  @Post()
  @Permissions('events.create')
  create(
    @Body() dto: CreateTripDetailDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdResponseDto> {
    return this.service.create(dto, user);
  }
}
