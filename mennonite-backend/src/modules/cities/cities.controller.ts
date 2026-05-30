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
import { CitiesService } from './cities.service';
import { CityResponseDto } from './dto/city.response.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { ListCitiesQueryDto } from './dto/list-cities-query.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';

@ApiTags('Cities')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('cities')
export class CitiesController {
  constructor(private readonly service: CitiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('catalog.cities.manage')
  @ApiOperation({ summary: 'Crear una ciudad' })
  @ApiCreatedResponse({ type: IdNameResponseDto })
  @ApiBadRequestResponse({
    description: 'Departamento inexistente o payload invalido',
  })
  @ApiConflictResponse({ description: 'Ciudad duplicada en ese departamento' })
  create(@Body() dto: CreateCityDto): Promise<IdNameResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @Permissions('catalog.cities.read')
  @ApiOkResponse({ type: CityResponseDto, isArray: true })
  findAll(@Query() query: ListCitiesQueryDto): Promise<CityResponseDto[]> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions('catalog.cities.read')
  @ApiOkResponse({ type: CityResponseDto })
  @ApiNotFoundResponse({ description: 'Ciudad no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CityResponseDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('catalog.cities.manage')
  @ApiOkResponse({ type: IdNameResponseDto })
  @ApiBadRequestResponse({
    description: 'Departamento inexistente o payload invalido',
  })
  @ApiConflictResponse({ description: 'Ciudad duplicada en ese departamento' })
  @ApiNotFoundResponse({ description: 'Ciudad no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCityDto,
  ): Promise<IdNameResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('catalog.cities.manage')
  @ApiNoContentResponse({ description: 'Ciudad eliminada' })
  @ApiConflictResponse({ description: 'Existen iglesias asociadas' })
  @ApiNotFoundResponse({ description: 'Ciudad no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
