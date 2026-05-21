import { Module } from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

import { MinistriesController } from './ministries.controller';
import { MinistriesService } from './ministries.service';

@Module({
  controllers: [MinistriesController],
  providers: [
    MinistriesService,
    JwtAuthGuard,
    PermissionsGuard,
  ],
})
export class MinistriesModule {}