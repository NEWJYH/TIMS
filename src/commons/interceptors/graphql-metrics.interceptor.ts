

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { GraphQLResolveInfo } from 'graphql';

@Injectable()
export class GraphqlMetricsInterceptor implements NestInterceptor {
  constructor(
    // [중요] 미들웨어의 http_requests_total과 겹치지 않도록 이름 변경
    @InjectMetric('graphql_operations_total') public counter: Counter<string>,
    @InjectMetric('graphql_operation_duration_seconds')
    public histogram: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const type = context.getType<string>();

    // [1] GraphQL 요청이 아니면 그냥 통과시킵니다.
    // (REST API 트래픽은 이제 미들웨어가 전담합니다)
    if (type !== 'graphql') {
      return next.handle();
    }

    // [2] GraphQL 세부 정보(쿼리/뮤테이션 이름) 추출
    const gqlCtx = GqlExecutionContext.create(context);
    const info = gqlCtx.getInfo<GraphQLResolveInfo>();
    const fieldName = info?.fieldName || 'Anonymous'; // 예: fetchUser, createTire

    const start = Date.now();

    return next.handle().pipe(
      // [3] 성공 케이스 (Business Logic Success)
      tap(() => {
        const duration = (Date.now() - start) / 1000;
        // label: 성공 여부, 쿼리 이름
        this.counter.labels('success', fieldName).inc();
        this.histogram.labels('success', fieldName).observe(duration);
      }),

      // [4] 실패 케이스 (Business Logic Error)
      // 미들웨어는 200 OK로 볼 수도 있지만, 여기서는 실제 에러로 기록됨
      catchError((error: Error) => {
        const duration = (Date.now() - start) / 1000;
        this.counter.labels('error', fieldName).inc();
        this.histogram.labels('error', fieldName).observe(duration);

        // 에러를 다시 던져줘야 클라이언트에게 에러 메시지가 전달됩니다.
        return throwError(() => error);
      }),
    );
  }
}
