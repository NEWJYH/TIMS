import { Module } from '@nestjs/common';
import { UsersModule } from './apis/users/users.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesModule } from './apis/roles/roles.module';
import { StoresModule } from './apis/stores/stores.module';
import { TiresModule } from './apis/tires/tires.module';
import { InventoriesModule } from './apis/inventories/inventories.module';
import { RoleRequestsModule } from './apis/roleRequests/roleRequests.module';
import { AuthModule } from './apis/auth/auth.module';
import { Request, Response } from 'express';
import { ConfigModule } from '@nestjs/config';
import { InventoryHistoriesModule } from './apis/inventoryHistories/inventoryHistories.module';
import { FilesModule } from './apis/files/files.module';
import { gqlFormatError } from './commons/graphql/format-error';
import { createGqlContext } from './commons/graphql/context';

@Module({
  imports: [
    AuthModule, //
    FilesModule,
    InventoriesModule,
    InventoryHistoriesModule,
    RolesModule,
    RoleRequestsModule,
    StoresModule,
    TiresModule,
    UsersModule,
    // config
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // graphql setting
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'src/commons/graphql/schema.gql',
      formatError: gqlFormatError,
      context: createGqlContext,
      playground: true,
    }),
    // typeorm setting
    TypeOrmModule.forRoot({
      type: process.env.DATABASE_TYPE as 'mysql',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_DATABASE,
      entities: [__dirname + '/apis/**/*.entity.*'],
      synchronize: true,
      logging: true,
    }),
  ],
})
export class AppModule {}
