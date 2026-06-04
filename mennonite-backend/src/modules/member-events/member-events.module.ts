import { Module } from '@nestjs/common';
import { MemberEventsService } from './member-events.service';
import { MemberEventsController } from './member-events.controller';

@Module({
  controllers: [MemberEventsController],
  providers: [MemberEventsService],
})
export class MemberEventsModule {}
