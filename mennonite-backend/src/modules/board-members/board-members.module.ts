import { Module } from '@nestjs/common';
import { BoardMembersController } from './board-members.controller';
import { BoardMembersService } from './board-members.service';

@Module({
  controllers: [BoardMembersController],
  providers: [BoardMembersService],
})
export class BoardMembersModule {}
