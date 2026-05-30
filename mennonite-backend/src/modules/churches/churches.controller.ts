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
import { ChurchesService } from './churches.service';
import { ChurchResponseDto } from './dto/church.response.dto';
import { CreateChurchDto } from './dto/create-church.dto';
import { UpdateChurchDto } from './dto/update-church.dto';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';

@ApiTags('Churches')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('churches')
export class ChurchesController {
  constructor(private readonly service: ChurchesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('churches.create')
  @ApiOperation({ summary: 'Crear una iglesia' })
  @ApiCreatedResponse({ type: IdNameResponseDto })
  @ApiBadRequestResponse({
    description: 'Ciudad inexistente o payload invalido',
  })
  create(@Body() dto: CreateChurchDto): Promise<IdNameResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @Permissions('churches.read')
  @ApiOkResponse({ type: ChurchResponseDto, isArray: true })
  findAll(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ChurchResponseDto[]> {
    return this.service.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @Permissions('churches.read')
  @ApiOkResponse({ type: ChurchResponseDto })
  @ApiNotFoundResponse({ description: 'Iglesia no encontrada' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ChurchResponseDto> {
    return this.service.findOne(id, includeInactive === 'true');
  }

  @Patch(':id')
  @Permissions('churches.update')
  @ApiOkResponse({ type: IdNameResponseDto })
  @ApiBadRequestResponse({
    description: 'Ciudad inexistente o payload invalido',
  })
  @ApiNotFoundResponse({ description: 'Iglesia no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChurchDto,
  ): Promise<IdNameResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('churches.delete')
  @ApiNoContentResponse({ description: 'Iglesia dada de baja' })
  @ApiNotFoundResponse({ description: 'Iglesia no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
