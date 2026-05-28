import { Module } from '@nestjs/common';
import { InventoryMovementsService } from './inventory-movement.service';
import { InventoryMovementsController } from './inventory-movement.controller';

@Module({
  controllers: [InventoryMovementsController],
  providers: [InventoryMovementsService],
})
export class InventoryMovementsModule {}
