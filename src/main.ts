import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomHttpExceptionFilter } from './commons/filters/custom-exception.filter';
import { winstonLogger } from './utils/winston.config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import * as morgan from 'morgan';
import { LoggingInterceptor } from './commons/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
  });

  // Morgan 커스텀 토큰 정의 (req.user는 Guard가 통과된 후에만 존재함)
  morgan.token('user', (req: any) => {
    return req.user ? req.user.id : 'Guest';
  });

  // 3. 'combined' 대신 커스텀 포맷 사용
  const morganFormat =
    ':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

  app.use(
    morgan(morganFormat, {
      stream: {
        write: (message: string) => {
          // Winston을 통해 로그 기록 (Context: 'Morgan')
          winstonLogger.log(message.replace('\n', ''), 'Morgan');
        },
      },
    }),
  );
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // CORS 설정 (쿠키 인증을 위해 credentials 필수)
  app.enableCors({
    origin: true, // 프론트엔드 주소에 맞춰 설정 (개발 중엔 true)
    credentials: true,
  });

  // DTO 유효성 검사 파이프 (class-validator 작동용)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 입력값(JSON)을 DTO 클래스로 자동 변환
      whitelist: true, // DTO에 정의되지 않은 속성이 들어오면 자동으로 제거
      // forbidNonWhitelisted: true, // DTO에 없는 속성을 보내면 에러를 냄
    }),
  );

  // 6. 전역 예외 필터
  app.useGlobalFilters(new CustomHttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
