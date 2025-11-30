import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesModule } from '../roles/roles.module';
import { StoresModule } from '../stores/stores.module';
import { RoleRequest } from './entities/roleRequest.entity';
import { RoleRequestsResolver } from './roleRequests.resolver';
import { RoleRequestsService } from './roleRequests.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleRequest, //
    ]),
    RolesModule, //
    StoresModule,
    UsersModule,
  ],
  providers: [
    RoleRequestsResolver, //
    RoleRequestsService,
  ],
  exports: [
    RoleRequestsService, //
  ],
})
export class RoleRequestsModule {}
