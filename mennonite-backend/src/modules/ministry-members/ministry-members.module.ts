import { Module } from '@nestjs/common';
import { MinistryMembersController } from './ministry-members.controller';
import { MinistryMembersService } from './ministry-members.service';

@Module({
  controllers: [MinistryMembersController],
  providers: [MinistryMembersService],
  exports: [MinistryMembersService],
})
export class MinistryMembersModule {}
