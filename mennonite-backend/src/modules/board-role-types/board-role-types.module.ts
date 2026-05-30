import { Module } from '@nestjs/common';
import { BoardRoleTypesController } from './board-role-types.controller';
import { BoardRoleTypesService } from './board-role-types.service';

@Module({
  controllers: [BoardRoleTypesController],
  providers: [BoardRoleTypesService],
})
export class BoardRoleTypesModule {}
