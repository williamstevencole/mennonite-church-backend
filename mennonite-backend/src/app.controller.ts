import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';
import { ApiStatusDto } from './dto/api-status.dto';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get hello message' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Get backend status' })
  @ApiOkResponse({ type: ApiStatusDto })
  getStatus(): ApiStatusDto {
    return {
      status: 'ok',
      service: 'mennonite-backend',
    };
  }
}
