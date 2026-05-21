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
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { MinistriesPageResponseDto } from './dto/ministries-page.response.dto';
import { ListMinistriesQueryDto } from './dto/list-ministries-query.dto';
import { MinistriesService } from './ministries.service';

@ApiTags('Ministries')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('ministries')
export class MinistriesController {
  constructor(private readonly ministriesService: MinistriesService) { }

  @Get()
  @Permissions('ministries.read')
  @ApiOperation({ summary: 'Listar ministerios con filtros y paginacion' })
  @ApiOkResponse({ type: MinistriesPageResponseDto })
  findAll(@Query() query: ListMinistriesQueryDto): Promise<MinistriesPageResponseDto> {
    return this.ministriesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ministriesService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ministriesService.remove(+id);
  }
}
