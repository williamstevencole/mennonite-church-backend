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
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { IdResponseDto } from '../../common/dto/id-response.dto';
import { BudgetCategoriesService } from './budget-categories.service';
import { BudgetCategoryResponseDto } from './dto/budget-category.response.dto';
import { CreateBudgetCategoryDto } from './dto/create-budget-category.dto';
import { UpdateBudgetCategoryDto } from './dto/update-budget-category.dto';

@ApiTags('Budget Categories')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('budget-categories')
export class BudgetCategoriesController {
  constructor(private readonly service: BudgetCategoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('budgets.create')
  @ApiOperation({ summary: 'Crear categoria de presupuesto' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiNotFoundResponse({ description: 'Budget o categoria no encontrada' })
  @ApiConflictResponse({ description: 'Categoria ya asignada al presupuesto' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBudgetCategoryDto,
  ): Promise<IdResponseDto> {
    return this.service.create(user, dto);
  }

  @Get(':id')
  @Permissions('budgets.read')
  @ApiOkResponse({ type: BudgetCategoryResponseDto })
  @ApiNotFoundResponse({
    description: 'Categoria de presupuesto no encontrada',
  })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BudgetCategoryResponseDto> {
    return this.service.findOne(user, id);
  }

  @Patch(':id')
  @Permissions('budgets.update')
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiNotFoundResponse({
    description: 'Categoria de presupuesto no encontrada',
  })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBudgetCategoryDto,
  ): Promise<IdResponseDto> {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('budgets.delete')
  @ApiNoContentResponse({ description: 'Categoria eliminada' })
  @ApiNotFoundResponse({
    description: 'Categoria de presupuesto no encontrada',
  })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.service.remove(user, id);
  }
}
