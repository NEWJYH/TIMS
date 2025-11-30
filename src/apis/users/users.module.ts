import { Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RolesModule } from '../roles/roles.module';
import { StoresModule } from '../stores/stores.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, //
    ]),
    RolesModule,
    StoresModule,
  ],
  providers: [
    UsersResolver, //
    UsersService,
  ],
  exports: [
    UsersService, //
  ],
})
export class UsersModule {}
