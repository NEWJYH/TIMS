import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, tap, throwError } from 'rxjs'; // 👈 throwError import
import { catchError } from 'rxjs/operators'; // 👈 catchError import

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = GqlExecutionContext.create(context);
    const info = ctx.getInfo();
    const req = ctx.getContext().req;

    const fieldName = info.fieldName;
    const user = req.user ? req.user.id : 'Guest';
    const ip = req.ip;
    const now = Date.now();

    return next.handle().pipe(
      // 1. 성공 시 로그 (기존 tap)
      tap(() => {
        const duration = Date.now() - now;
        this.logger.log(
          `[GraphQL] ${fieldName} | User: ${user} | IP: ${ip} | SUCCESS in ${duration}ms`,
        );
      }),

      // 실패 시 로그 기록 및 에러 재전파
      catchError((err) => {
        const duration = Date.now() - now;
        // 실패 로그는 error 레벨로 찍고, 에러 내용을 포함
        this.logger.error(
          `[GraphQL] ${fieldName} | User: ${user} | FAILED in ${duration}ms | Reason: ${err.message}`,
          err.stack, // 스택 트레이스도 같이 기록
        );
        // 잡은 에러를 다시 던져서 Exception Filter로
        return throwError(() => err);
      }),
    );
  }
}
