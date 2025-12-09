import {
  Module,
  Global,
  ValidationPipe,
  NestModule,
  MiddlewareConsumer,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { APP_INTERCEPTOR, APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { gqlFormatError } from '../graphql/format-error';
import { createGqlContext } from '../graphql/context';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { IgnoreMetricsClassSerializerInterceptor } from '../interceptors/ignore-metrics.interceptor';
import { CustomHttpExceptionFilter } from '../filters/custom-exception.filter';
import { MetricsController } from '../../metrics.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { ValkeyCacheService } from './services/valkey-cache.service';
import { redisStore } from 'cache-manager-redis-yet';
import { GraphqlMetricsInterceptor } from '../interceptors/graphql-metrics.interceptor';
import { MetricsMiddleware } from '../middleware/metrics.middleware';
@Global()
@Module({
  imports: [
    // 1. Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env.docker' : '.env',
    }),

    // 2. TypeORM
    TypeOrmModule.forRoot({
      type: process.env.DATABASE_TYPE as 'mysql',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_DATABASE,
      entities: [__dirname + '/../../apis/**/*.entity.*'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
    }),

    // 3. GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'src/commons/graphql/schema.gql',
      formatError: gqlFormatError,
      context: createGqlContext,
      playground: true, // process.env.NODE_ENV !== 'production'
      introspection: true, // process.env.NODE_ENV !== 'production'
    }),

    // 4. Prometheus
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),

    // 5. Cash-valkey
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = await redisStore({
          url: process.env.VALKEY_HOST,
          ttl: 3000,
        });

        return { store };
      },
    }),
  ],
  providers: [
    // HTTP 레벨 메트릭 (Middleware)
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 3, 5, 10],
    }),
    // GraphQL 비즈니스 로직 메트릭 (Interceptor)
    makeCounterProvider({
      name: 'graphql_operations_total',
      help: 'Total number of GraphQL operations',
      labelNames: ['status', 'operation'],
    }),
    makeHistogramProvider({
      name: 'graphql_operation_duration_seconds',
      help: 'Duration of GraphQL operations in seconds',
      labelNames: ['status', 'operation'],
      buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 3, 5, 10],
    }),
    // --- 글로벌 인터셉터 ---
    // 1. 로깅
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // 2. 메트릭 측정
    {
      provide: APP_INTERCEPTOR,
      useClass: GraphqlMetricsInterceptor,
    },
    // 3. 직렬화
    {
      provide: APP_INTERCEPTOR,
      useClass: IgnoreMetricsClassSerializerInterceptor,
    },
    // --- 글로벌 파이프 (Validation) ---
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          transform: true, // 입력값(JSON)을 DTO 클래스로 자동 변환
          whitelist: true, // DTO에 정의되지 않은 속성이 들어오면 자동으로 제거
        }),
    },
    // --- 글로벌 필터 (Exception) ---
    {
      provide: APP_FILTER,
      useClass: CustomHttpExceptionFilter,
    },
    //
    ValkeyCacheService,
  ],
  controllers: [
    MetricsController, //
  ],
  exports: [
    PrometheusModule, //
    ValkeyCacheService,
  ],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MetricsMiddleware) // 미들웨어 적용
      .forRoutes('*'); // 모든 경로
  }
}
