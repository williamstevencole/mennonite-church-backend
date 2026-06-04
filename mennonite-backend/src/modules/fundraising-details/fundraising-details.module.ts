import { Module } from '@nestjs/common';
import { FundraisingDetailsController } from './fundraising-details.controller';
import { FundraisingDetailsService } from './fundraising-details.service';

@Module({
  controllers: [FundraisingDetailsController],
  providers: [FundraisingDetailsService],
})
export class FundraisingDetailsModule {}
