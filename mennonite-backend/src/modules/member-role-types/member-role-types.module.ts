import { Module } from '@nestjs/common';
import { MemberRoleTypesService } from './member-role-types.service';
import { MemberRoleTypesController } from './member-role-types.controller';

@Module({
  controllers: [MemberRoleTypesController],
  providers: [MemberRoleTypesService],
})
export class MemberRoleTypesModule {}
