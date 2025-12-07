import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Request, Response } from 'express';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import { NestExpressApplication } from '@nestjs/platform-express';
import { morganLogging } from './commons/middleware/logger.middleware';
import { winstonLogger } from './commons/logger/winston.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: winstonLogger,
  });

  // Express 레벨 미들웨어 및 설정
  app.set('trust proxy', true);
  app.use('/favicon.ico', (_req: Request, res: Response) =>
    res.status(204).end(),
  );
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));
  app.use(morganLogging);

  app.enableCors({
    origin: true,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
