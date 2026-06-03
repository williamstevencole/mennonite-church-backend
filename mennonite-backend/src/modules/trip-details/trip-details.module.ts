import { Module } from '@nestjs/common';
import { TripDetailsService } from './trip-details.service';
import { TripDetailsController } from './trip-details.controller';

@Module({
  controllers: [TripDetailsController],
  providers: [TripDetailsService],
})
export class TripDetailsModule {}
