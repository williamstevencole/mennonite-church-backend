import { Module } from '@nestjs/common';
import { BoardMembersModule } from '../board-members/board-members.module';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';

@Module({
  imports: [BoardMembersModule],
  controllers: [BoardsController],
  providers: [BoardsService],
})
export class BoardsModule {}
