import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomHttpExceptionFilter } from './commons/filters/custom-exception.filter';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './commons/interceptors/logging.interceptor';
import { Request, Response } from 'express';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import { NestExpressApplication } from '@nestjs/platform-express';
import { morganLogging } from './middleware/logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // proxy 설정 : Nginx 등 리버스 프록시 뒤에 있을 때 실제 클라이언트 IP 식별하기 위함
  app.set('trust proxy', true);
  // favicon 무시 : 브라우저의 불필요한 파비콘 요청(404 에러 로그 유발)을 204로 처리
  app.use('/favicon.ico', (req: Request, res: Response) =>
    res.status(204).end(),
  );
  // 파일 업로드 : GraphQL 파일 업로드를 위한 미들웨어 (10MB 제한, 최대 10개)
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));
  // Morgan 연결 : HTTP 요청 로그를 가로채서 Winston Logger를 통해 출력/저장
  app.use(morganLogging);
  // Interceptor : 로깅 인터셉터 : GraphQL 요청의 시작/끝 시간 및 성공 여부 기록
  app.useGlobalInterceptors(new LoggingInterceptor());
  // Interceptor : 직렬화 인터셉터 : 엔티티 적용 필수
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  // CORS : 프론트엔드와 통신 허용
  app.enableCors({
    origin: true, // 프론트엔드 주소에 맞춰 설정 (개발 중엔 true)
    credentials: true, //  쿠키 인증을 위해 credentials 필수
  });
  // Pipe : DTO 유효성 검사 파이프
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 입력값(JSON)을 DTO 클래스로 자동 변환
      whitelist: true, // DTO에 정의되지 않은 속성이 들어오면 자동으로 제거
      // forbidNonWhitelisted: true, // DTO에 없는 속성을 보내면 에러를 냄
    }),
  );
  // Filter : 전역 예외 필터 모든 에러를 잡아 표준화된 포맷(GraphQL Error)로 변환
  app.useGlobalFilters(new CustomHttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
