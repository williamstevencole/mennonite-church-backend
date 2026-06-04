import { Module } from '@nestjs/common';
import { MemberEventService } from './member-event.service';
import { MemberEventController } from './member-event.controller';

@Module({
  controllers: [MemberEventController],
  providers: [MemberEventService],
})
export class MemberEventModule {}
