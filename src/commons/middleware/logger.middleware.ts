import * as morgan from 'morgan';
import { Request } from 'express';
import { winstonLogger } from 'src/commons/logger/winston.config';

morgan.token('masked-url', (req: Request) => {
  const url = req.originalUrl || req.url;
  // 쿼리 없으면 원본 그대로 반환
  if (!url.includes('?')) return url;

  const [path, queryString] = url.split('?');
  const params = new URLSearchParams(queryString);

  // 'code' 파라미터가 있다면 마스킹
  if (params.has('code')) {
    params.set('code', '*****');
  }
  // 추가 마스킹
  // if (params.has('token')) params.set('token', '*****');
  return `${path}?${params.toString()}`;
});

// Morgan 토큰 : 로그인한 유저라면 ID를, 아니면 Guest로 로그 남김
morgan.token('user', (req: Request & { user?: { id: string } }) => {
  return req.user ? req.user.id : 'Guest';
});

// Morgan 포맷 : IP, 유저, 시간, 메서드, URL, 상태코드, 응답크기 등 상세 정보 정의
const morganFormat =
  ':remote-addr - :user [:date[clf]] ":method :masked-url HTTP/:http-version" :status :res[content-length] - :response-time ms ":referrer" ":user-agent"';

export const morganLogging = morgan(morganFormat, {
  skip: (req: Request) => {
    // /metrics, /health, /favicon.ico 는 로그 안 남김
    return (
      req.originalUrl?.includes('/metrics') ||
      req.originalUrl?.includes('/health') ||
      req.originalUrl?.includes('/favicon.ico')
    );
  },
  stream: {
    write: (message: string) => {
      winstonLogger.log(message.replace('\n', ''));
    },
  },
});
