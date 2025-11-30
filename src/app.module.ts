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
// import * as Joi from 'joi';

@Module({
  imports: [
    UsersModule, //
    RolesModule,
    StoresModule,
    TiresModule,
    InventoriesModule,
    RoleRequestsModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true, // 전역 모듈로 설정 (어디서든 ConfigService 사용 가능)
      // validationSchema: Joi.object({
      //   // 필수 환경변수 정의 (없으면 서버 실행 안 됨!)
      //   JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
      //   JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
      //   JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.string().default('1h'),
      //   JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().default('2w'),
      // }),
    }),
    // graphql setting
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'src/commons/graphql/schema.gql',
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
    }),
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
