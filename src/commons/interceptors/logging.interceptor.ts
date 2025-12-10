import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { IAuthUser, IContext } from '../interfaces/context';
import { User } from 'src/apis/users/entities/user.entity';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    // 컨텍스트 타입 확인 (graphql, http)
    const contextType = context.getType<GqlContextType>();

    let req: Request & IAuthUser;
    let action = '';
    let user: User | string = 'Guest';

    // [2] 타입에 따라 데이터 추출 방식 분기
    if (contextType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const info = gqlCtx.getInfo<GraphQLResolveInfo>();
      const ctx = gqlCtx.getContext<IContext>();

      req = ctx.req;
      // GraphQL은 쿼리 이름을 action으로 사용
      action = `[GraphQL] ${info.fieldName}`;
      user = req.user ? req.user.id : 'Guest';
    } else if (contextType === 'http') {
      const httpCtx = context.switchToHttp();
      req = httpCtx.getRequest<Request & IAuthUser>();

      // REST API는 Method + URL을 action으로 사용
      action = `[HTTP] ${req.method} ${req.path}`;
      // req.user 타입 단언 필요 (Passport 사용 시)
      const httpUser = req.user as { id: string } | undefined;
      if (httpUser && httpUser.id) {
        user = String(httpUser.id);
      }
    } else {
      // RPC, WebSocket 등 처리가 안 된 타입은 그냥 통과
      return next.handle();
    }

    // [3] 공통 로직
    let ip = req.ip;
    if (!ip && req.headers?.['x-forwarded-for']) {
      const xForwardedFor = req.headers['x-forwarded-for'];
      ip = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor.split(',')[0];
    }
    if (!ip) {
      ip = req.socket?.remoteAddress || 'Unknown';
    }
    // 메트릭 경로 제외
    if (req.originalUrl === '/metrics') {
      return next.handle();
    }

    // [5] 로그 출력
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.logger.log(
          `${action} | User: ${user} | IP: ${ip} | SUCCESS in ${duration}ms`,
        );
      }),

      catchError((err: unknown) => {
        const duration = Date.now() - now;
        const errMsg = err instanceof Error ? err.message : String(err);

        this.logger.warn(
          `${action} | User: ${user} | IP: ${ip} | FAILED in ${duration}ms | ${errMsg}`,
        );

        return throwError(() => err);
      }),
    );
  }
}
