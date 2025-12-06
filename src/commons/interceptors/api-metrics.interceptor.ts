// import {
//   CallHandler,
//   ExecutionContext,
//   Injectable,
//   NestInterceptor,
// } from '@nestjs/common';
// import { GqlExecutionContext } from '@nestjs/graphql';
// import { Observable } from 'rxjs';
// import { InjectMetric } from '@willsoto/nestjs-prometheus';
// import { Counter } from 'prom-client';
// import { GraphQLResolveInfo } from 'graphql';
// import { Request } from 'express'; // express Request 타입

// @Injectable()
// export class ApiMetricsInterceptor implements NestInterceptor {
//   constructor(
//     @InjectMetric('api_requests_total') public counter: Counter<string>,
//   ) {}

//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     const type = context.getType(); // http, graphql, rpc ...

//     // GraphQL 요청
//     if ((type as string) === 'graphql') {
//       const gqlCtx = GqlExecutionContext.create(context);
//       const info = gqlCtx.getInfo<GraphQLResolveInfo>();
//       // 쿼리 이름 가져오기 (이름이 없으면 'Anonymous'로 기록)
//       const operationName = info?.fieldName || 'Anonymous';

//       // 라벨: type='graphql', action=쿼리이름
//       this.counter.labels('graphql', operationName).inc();
//     }

//     // REST API 요청
//     else if (type === 'http') {
//       const req = context.switchToHttp().getRequest<Request>();
//       // 무시할 경로
//       const ignoredPaths = ['/metrics', '/favicon.ico', '/health'];
//       if (ignoredPaths.some((path) => req.url.includes(path))) {
//         return next.handle();
//       }

//       const method = req.method;
//       const route = req.route as { path: string } | undefined;
//       let url = route?.path || req.path;
//       // image 와일드카드 경로는 강제로 이름을 고정
//       if (req.originalUrl.startsWith('/files/')) {
//         url = '/files/:filename';
//       }

//       // 라벨: type='rest', action='GET /users'
//       this.counter.labels('rest', `${method} ${url}`).inc();
//     }

//     return next.handle();
//   }
// }

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators'; // RxJS 연산자 추가
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';
import { GraphQLResolveInfo } from 'graphql';
import { Request, Response } from 'express';

@Injectable()
export class ApiMetricsInterceptor implements NestInterceptor {
  constructor(
    // 중요: 모듈 등록 시 labelNames에 ['type', 'action', 'status'] 3개가 있어야 함
    @InjectMetric('api_requests_total') public counter: Counter<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const type = context.getType();
    let labelType = '';
    let labelAction = '';

    // GraphQL 요청
    if ((type as string) === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const info = gqlCtx.getInfo<GraphQLResolveInfo>();
      labelType = 'graphql';
      labelAction = info?.fieldName || 'Anonymous';
    } else if (type === 'http') {
      // REST API 요청
      const req = context.switchToHttp().getRequest<Request>();
      const ignoredPaths = ['/metrics', '/favicon.ico', '/health'];
      if (ignoredPaths.some((path) => req.url.includes(path))) {
        return next.handle();
      }

      const method = req.method;
      // req.route가 없는 경우(404 등) 대비
      const routePath =
        (req.route as { path: string } | undefined)?.path || req.path;

      let url = routePath;
      if (req.originalUrl.startsWith('/files/')) {
        url = '/files/:filename';
      }

      labelType = 'rest';
      labelAction = `${method} ${url}`;
    }

    // 요청 처리 파이프라인 (여기서 성공/실패 기록)
    return next.handle().pipe(
      // [성공 시]
      tap(() => {
        let status = '200'; // 기본 성공 코드
        if (labelType === 'rest') {
          const res = context.switchToHttp().getResponse<Response>();
          status = res.statusCode.toString();
        }

        this.counter.labels(labelType, labelAction, status).inc();
      }),

      // 에러 발생
      catchError((error: Error) => {
        let status = '500'; // 기본 에러 코드

        // HTTP 예외인 경우 해당 상태 코드 가져오기 (예: 400, 401, 404)
        if (error instanceof HttpException) {
          status = error.getStatus().toString();
        }
        // GraphQL 등 일반 에러는 500 처리 (혹은 error.code 확인 가능)
        this.counter.labels(labelType, labelAction, status).inc();

        // 에러를 다시 던져줘야 클라이언트가 에러 응답을 받을 수 있음
        return throwError(() => error);
      }),
    );
  }
}
