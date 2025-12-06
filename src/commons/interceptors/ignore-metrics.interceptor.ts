import {
  ClassSerializerInterceptor,
  Injectable,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class IgnoreMetricsClassSerializerInterceptor extends ClassSerializerInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType<GqlContextType>() === 'graphql') {
      return super.intercept(context, next);
    }

    // HTTP 요청일 때만 Request 객체를 꺼냄
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();

    // Request가 존재하고, URL이 /metrics를 포함하면 -> 직렬화 건너뛰기
    if (request && request.url && request.url.includes('/metrics')) {
      return next.handle();
    }

    // 4. 그 외 일반 HTTP 요청 -> 원래 기능(직렬화) 수행
    return super.intercept(context, next);
  }
}
