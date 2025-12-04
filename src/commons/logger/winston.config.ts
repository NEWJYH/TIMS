import { utilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const env = process.env.NODE_ENV;
const logDir = process.cwd() + '/logs';

// 로그 파일 설정 (날짜별로 파일 분리)
const dailyOptions = (level: string) => {
  return {
    level,
    datePattern: 'YYYY-MM-DD',
    dirname: logDir + `/${level}`,
    filename: `%DATE%.${level}.log`,
    maxFiles: '30d', // 30일치 보관
    zippedArchive: true, // 압축
    maxSize: '20m', // 파일 하나당 최대 20MB (넘으면 분할)
  };
};

export const winstonLogger = WinstonModule.createLogger({
  transports: [
    // 1. 콘솔 출력 설정
    new winston.transports.Console({
      level: env === 'production' ? 'http' : 'silly',
      format:
        env === 'production'
          ? winston.format.simple()
          : winston.format.combine(
              winston.format.timestamp(),
              utilities.format.nestLike('TIMS', {
                prettyPrint: true, // 로그를 예쁘게 출력
                colors: true, // 색상 적용
              }),
            ),
    }),

    // 2. 파일 저장 (Info 이상)
    // winston-daily-rotate-file 패키지가 winston.transports에 자동으로 등록
    new winston.transports.DailyRotateFile(dailyOptions('info')),

    // 3. 에러 로그 별도 저장
    new winston.transports.DailyRotateFile(dailyOptions('error')),
  ],
});
