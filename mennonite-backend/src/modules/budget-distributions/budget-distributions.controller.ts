import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiCreatedResponse } from '@nestjs/swagger';

import { BudgetDistributionService } from './budget-distributions.service';
import { CreateBudgetDistributionDto } from './dto/create-budget-distribution.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import type { JwtPayload } from 'src/auth/strategies/jwt.strategy';
import { FindBudgetDistributionsQueryDto } from './dto/find-budget-distribution.dto';
import { UpdateBudgetDistributionDto } from './dto/update-budget-distribution.dto';

@ApiTags('Budget Distributions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('budget-distributions')
export class BudgetDistributionController {
  constructor(
    private readonly budgetDistributionService: BudgetDistributionService,
  ) {}
  @Post()
  @Permissions('budgets.create')
  @ApiCreatedResponse({ description: 'Distribution created' })
  create(
    @Body() dto: CreateBudgetDistributionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.budgetDistributionService.create(dto, user);
  }

  @Get()
  @Permissions('budgets.read')
  findAll(
    @Query() query: FindBudgetDistributionsQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.budgetDistributionService.findAll(query, user);
  }

  @Get(':id')
  @Permissions('budgets.read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.budgetDistributionService.findOne(id, user);
  }

  @Patch(':id')
  @Permissions('budgets.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBudgetDistributionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.budgetDistributionService.update(id, dto, user);
  }
}
