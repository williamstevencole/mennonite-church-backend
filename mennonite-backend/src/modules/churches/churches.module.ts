import { Module } from '@nestjs/common';
import { ChurchesController } from './churches.controller';
import { ChurchesService } from './churches.service';
import { UserRolesModule } from '../user-roles/user-roles.module';

@Module({
  imports: [UserRolesModule],
  controllers: [ChurchesController],
  providers: [ChurchesService],
})
export class ChurchesModule {}
