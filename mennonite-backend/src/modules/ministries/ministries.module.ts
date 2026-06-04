import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { MinistryMembersModule } from '../ministry-members/ministry-members.module';
import { MinistriesController } from './ministries.controller';
import { MinistriesService } from './ministries.service';

@Module({
  imports: [MinistryMembersModule],
  controllers: [MinistriesController],
  providers: [MinistriesService, JwtAuthGuard, PermissionsGuard],
})
export class MinistriesModule {}
