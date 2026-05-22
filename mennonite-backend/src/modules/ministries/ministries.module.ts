import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MinistriesService } from './ministries.service';
import { MinistriesController } from './ministries.controller';

@Module({
  controllers: [MinistriesController],
  providers: [MinistriesService, JwtAuthGuard, PermissionsGuard],
})
export class MinistriesModule {}
