import { Module } from '@nestjs/common';
import { MemberAssignmentsController } from './member-assignments.controller';
import { MemberAssignmentsService } from './member-assignments.service';

@Module({
  controllers: [MemberAssignmentsController],
  providers: [MemberAssignmentsService],
})
export class MemberAssignmentsModule {}
