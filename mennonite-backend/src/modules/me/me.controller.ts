import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import type { MyMinistriesRoleFilter } from './me.service';
import { MeService } from './me.service';
import { MyMinistryDto } from './dto/my-ministry.dto';

@ApiTags('Me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('ministries')
  @ApiOperation({ summary: 'Ministerios del usuario logueado' })
  @ApiQuery({
    name: 'role',
    enum: ['leader', 'member'],
    required: false,
  })
  @ApiOkResponse({ type: [MyMinistryDto] })
  myMinistries(
    @CurrentUser() user: JwtPayload,
    @Query('role') role?: MyMinistriesRoleFilter,
  ): Promise<MyMinistryDto[]> {
    return this.meService.findMyMinistries(user.sub, role);
  }
}
