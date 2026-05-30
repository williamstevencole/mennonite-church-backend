import { Module } from '@nestjs/common';
import { MinistryRoleTypesController } from './ministry-role-types.controller';
import { MinistryRoleTypesService } from './ministry-role-types.service';

@Module({
  controllers: [MinistryRoleTypesController],
  providers: [MinistryRoleTypesService],
})
export class MinistryRoleTypesModule {}
