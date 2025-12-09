import { Module } from '@nestjs/common';
import { CoreModule } from './commons/core/core.module';
// 비즈니스 모듈
import { UsersModule } from './apis/users/users.module';
import { RolesModule } from './apis/roles/roles.module';
import { StoresModule } from './apis/stores/stores.module';
import { TiresModule } from './apis/tires/tires.module';
import { InventoriesModule } from './apis/inventories/inventories.module';
import { RoleRequestsModule } from './apis/roleRequests/roleRequests.module';
import { AuthModule } from './apis/auth/auth.module';
import { FilesModule } from './apis/files/files.module';
import { InventoryHistoriesModule } from './apis/inventoryHistories/inventoryHistories.module';

@Module({
  imports: [
    CoreModule, // 모든 설정

    // 비즈니스 로직
    AuthModule,
    FilesModule,
    InventoriesModule,
    InventoryHistoriesModule,
    RolesModule,
    RoleRequestsModule,
    StoresModule,
    TiresModule,
    UsersModule,
  ],
})
export class AppModule {}
