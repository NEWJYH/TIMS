import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryHistory } from './entities/inventoryHistory.entity';
import { InventoryHistoriesResolver } from './inventoryHistories.resolver';
import { InventoryHistoriesService } from './inventoryHistories.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryHistory, //
    ]),
  ],
  providers: [
    InventoryHistoriesResolver, //
    InventoryHistoriesService,
  ],
  exports: [
    InventoryHistoriesService, //
  ],
})
export class InventoryHistoriesModule {}
