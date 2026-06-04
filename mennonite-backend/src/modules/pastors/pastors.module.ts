import { Module } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { PastorsController } from './pastors.controller';
import { PastorsService } from './pastors.service';

@Module({
  controllers: [PastorsController],
  providers: [PastorsService, PrismaService],
})
export class PastorsModule {}
