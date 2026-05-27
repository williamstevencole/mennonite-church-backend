import {
  Controller,
  HttpCode,
  HttpStatus,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { MemberCreatedResponseDto } from './dto/member-created.response.dto';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';

@ApiTags('Members')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('members.create')
  @ApiOperation({ summary: 'Crear un miembro' })
  @ApiCreatedResponse({ type: MemberCreatedResponseDto })
  @ApiBadRequestResponse({
    description: 'Formato o payload invalido',
  })
  @ApiConflictResponse({ description: 'Miembro duplicado' })
  create(
    @Body() createMemberDto: CreateMemberDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<MemberCreatedResponseDto> {
    return this.membersService.create(createMemberDto, user);
  }

  @Get()
  findAll() {
    return this.membersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.membersService.remove(+id);
  }
}
