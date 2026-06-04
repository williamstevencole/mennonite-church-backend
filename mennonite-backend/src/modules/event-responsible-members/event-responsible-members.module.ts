import { Module } from '@nestjs/common';
import { EventResponsibleMembersService } from './event-responsible-members.service';
import { EventResponsibleMembersController } from './event-responsible-members.controller';

@Module({
  controllers: [EventResponsibleMembersController],
  providers: [EventResponsibleMembersService],
})
export class EventResponsibleMembersModule {}
