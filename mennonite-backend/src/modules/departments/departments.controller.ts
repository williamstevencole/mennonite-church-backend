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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { DepartmentResponseDto } from './dto/department.response.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { IdResponseDto } from '../../common/dto/id-response.dto';

@ApiTags('Departments')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('catalog.departments.manage')
  @ApiOperation({ summary: 'Crear un departamento' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Nombre duplicado' })
  create(@Body() dto: CreateDepartmentDto): Promise<IdResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @Permissions('catalog.departments.read')
  @ApiOkResponse({ type: DepartmentResponseDto, isArray: true })
  findAll(): Promise<DepartmentResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @Permissions('catalog.departments.read')
  @ApiOkResponse({ type: DepartmentResponseDto })
  @ApiNotFoundResponse({ description: 'Departamento no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DepartmentResponseDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('catalog.departments.manage')
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Nombre duplicado' })
  @ApiNotFoundResponse({ description: 'Departamento no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<IdResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('catalog.departments.manage')
  @ApiNoContentResponse({ description: 'Departamento eliminado' })
  @ApiConflictResponse({ description: 'Existen ciudades asociadas' })
  @ApiNotFoundResponse({ description: 'Departamento no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
