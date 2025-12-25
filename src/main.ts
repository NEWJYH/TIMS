import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Request, Response } from 'express';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import { NestExpressApplication } from '@nestjs/platform-express';
import { morganLogging } from './commons/middleware/logger.middleware';
import { winstonLogger } from './commons/logger/winston.config';
import * as cookieParser from 'cookie-parser';
// import * as fs from 'fs';

async function bootstrap() {
  // const httpsOptions = {
  //   key: fs.readFileSync(process.env.HTTPS_KEY_PATH!),
  //   cert: fs.readFileSync(process.env.HTTPS_CERT_PATH!),
  // };
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // httpsOptions,
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
    origin: [
      process.env.ALLOW_DOMAIN_1!, //
      process.env.ALLOW_DOMAIN_2!, //
      process.env.ALLOW_DOMAIN_3!,
      process.env.ALLOW_DOMAIN_4!,
    ],
    credentials: true,
  });

  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
