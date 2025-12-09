import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(
    @InjectMetric('http_requests_total') public counter: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    public histogram: Histogram<string>,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    // 응답이 끝난(finish) 시점에 로직 실행
    res.on('finish', () => {
      const { statusCode } = res;
      const { method } = req;

      // URL 경로 정규화
      let path = req.baseUrl || req.path;
      if (
        path === '/metrics' ||
        path === '/health' ||
        path === '/favicon.ico'
      ) {
        return;
      }

      const route = req.route as { path: string } | undefined;

      // GraphQL 요청
      if (req.originalUrl.includes('/graphql')) {
        path = '/graphql';
      }
      // 파일 업로드 경로 정규화
      else if (req.originalUrl.startsWith('/files/')) {
        path = '/files/:filename';
      }
      // REST API의 경우, 매칭된 라우트 패턴이 있다면 그것을 사용 (/users/1 -> /users/:id)
      else if (route && route.path) {
        path = route.path;
      }
      // 404 에러 등 라우트가 없는 경우
      else {
        // 일단 어떤 공격이 들어오는지 보기 위해 path를 유지하거나, 정규화 전략
        path = req.path;
      }

      // 메트릭 기록
      const duration = (Date.now() - start) / 1000;

      this.counter.labels(method, path, statusCode.toString()).inc();
      this.histogram
        .labels(method, path, statusCode.toString())
        .observe(duration);
    });

    next();
  }
}
