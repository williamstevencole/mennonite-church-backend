import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

import { CreateMinistryDto } from './dto/create-ministry.dto';
import { MinistryCreatedResponseDto } from './dto/ministry-created.response.dto';

import { MinistriesService } from './ministries.service';

@ApiTags('Ministries')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('ministries')
export class MinistriesController {
  constructor(private readonly ministriesService: MinistriesService) {}

  @Post()
  @Permissions('ministries.create')
  @ApiOperation({ summary: 'Crear ministerio' })
  @ApiCreatedResponse({ type: MinistryCreatedResponseDto })
  @ApiConflictResponse({ description: 'Codigo duplicado' })
  @ApiBadRequestResponse({ description: 'Leader member no existe' })
  async create(
    @Body() dto: CreateMinistryDto,
    @Req() req: any,
  ): Promise<MinistryCreatedResponseDto> {
      console.log('req.user:', req.user);

    return this.ministriesService.create(dto, req.user);
  }
}

