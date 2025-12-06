import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { IContext } from '../interfaces/context';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const ctx = GqlExecutionContext.create(context);
    const info = ctx.getInfo<GraphQLResolveInfo>();
    const req = ctx.getContext<IContext>().req;
    const fieldName = info.fieldName;
    const user = req.user ? req.user.id : 'Guest';

    let ip = req.ip;
    // 헤더(X-Forwarded-For)
    if (!ip && req.headers?.['x-forwarded-for']) {
      const xForwardedFor = req.headers['x-forwarded-for'];
      // 헤더가 배열일 수도 있고 문자열일 수도 있어서 처리 필요
      ip = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor.split(',')[0];
    }
    // 실제 물리 소켓 주소
    if (!ip) {
      ip = req.socket?.remoteAddress || req.connection?.remoteAddress;
    }
    if (!ip) ip = 'Unknown';

    if (req?.url === '/metrics') {
      return next.handle();
    }

    return next.handle().pipe(
      // 성공 시 로그
      tap(() => {
        const duration = Date.now() - now;
        this.logger.log(
          `[GraphQL] ${fieldName} | User: ${user} | IP: ${ip} | SUCCESS in ${duration}ms`,
        );
      }),

      // 실패 시 로그 : 중복 방지를 위해 가볍게 변경
      catchError((err: unknown) => {
        const duration = Date.now() - now;
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `[GraphQL] ${fieldName} | User: ${user} | IP: ${ip} | FAILED in ${duration}ms | ${errMsg}`,
        );

        return throwError(() => err); // 에러 Filter로 토스
      }),
    );
  }
}
