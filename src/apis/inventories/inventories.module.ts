import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoriesResolver } from './inventories.resolver';
import { InventoriesService } from './inventories.service';
import { InventoryHistory } from '../inventoryHistory/entities/inventoryHistory.entity';
import { InventoryHistoryType } from '../inventoryHistoryTypes/entities/inventoryHistoryType.entity';
import { StoresModule } from '../stores/stores.module';
import { TiresModule } from '../tires/tires.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventory, //
      InventoryHistory,
      InventoryHistoryType,
    ]),
    StoresModule, // StoresService 쓰려면 필요
    TiresModule, // TiresService 쓰려면 필요
  ],
  providers: [
    InventoriesResolver, //
    InventoriesService,
  ],
  exports: [
    InventoriesService, //
  ],
})
export class InventoriesModule {}
