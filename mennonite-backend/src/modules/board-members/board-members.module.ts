import { Module } from '@nestjs/common';
import { BoardMembersController } from './board-members.controller';
import { BoardsMembersController } from './boards-members.controller';
import { BoardMembersService } from './board-members.service';

@Module({
  controllers: [BoardMembersController, BoardsMembersController],
  providers: [BoardMembersService],
})
export class BoardMembersModule {}
