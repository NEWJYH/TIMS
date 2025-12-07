import { Module, Global, ValidationPipe } from '@nestjs/common';
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
import { ApiMetricsInterceptor } from '../interceptors/api-metrics.interceptor';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { IgnoreMetricsClassSerializerInterceptor } from '../interceptors/ignore-metrics.interceptor';
import { CustomHttpExceptionFilter } from '../filters/custom-exception.filter';
import { MetricsController } from '../../metrics.controller';

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
  ],
  providers: [
    // --- 프로메테우스 카운터 ---
    makeCounterProvider({
      name: 'api_requests_total',
      help: 'Total number of API requests',
      labelNames: ['type', 'action', 'status'],
    }),
    makeHistogramProvider({
      name: 'api_request_duration_seconds',
      help: 'Duration of API requests in seconds',
      labelNames: ['type', 'action', 'status'],
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
      useClass: ApiMetricsInterceptor,
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
  ],
  controllers: [MetricsController],
  exports: [PrometheusModule],
})
export class CoreModule {}

// NestJS Lifecycle
// Middleware (Global -> Module) - 모건(Guest)
// Graphql 엔진 - 스키마 검사                                                        // 실패 가정
// Guards (Global -> Controller -> Route) - (AuthGuard - 여기서 req.user가 생김)     // 실행 x
// Interceptors (Pre-Controller) - 요청 시간 측정 시작.                               // 실행 x
// Pipes(Global -> Controller -> Route) (ValidationPipe - DTO 검사는 여기서 수행)     // 실행 x
// Controller (Resolver) - 비즈니스 로직 실행 (Service 호출)                            // 실행 x
// Interceptors (Post-Controller) - 응답 데이터 가공                                  // 실행 x
// Exception Filters (ExceptionFilter - 에러가 여기로 떨어짐)                           // 실행 x
