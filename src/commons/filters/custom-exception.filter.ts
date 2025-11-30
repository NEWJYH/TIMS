import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { AxiosError } from 'axios';

const mapHttpStatusToGqlCode = (status: number): string => {
  if (status >= 400 && status < 500) return 'BAD_USER_INPUT';
  if (status === 500) return 'INTERNAL_SERVER_ERROR';
  return `HTTP_${status}`;
};

@Catch()
export class CustomHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CustomHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '요청 처리 중 예기치 않은 오류가 발생했습니다.';
    let code = 'INTERNAL_SERVER_ERROR';

    // 1. NestJS HTTP 예외 처리 (ConflictException 등은 여기로 옴)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      message =
        typeof response === 'object' && 'message' in (response as any)
          ? (response as any).message
          : exception.message;

      code = mapHttpStatusToGqlCode(status);

      // 400번대 에러는 'warn'이나 'log'
      this.logger.warn(`[HttpException] ${status} - ${message}`);
    }

    // Axios 예외 처리
    else if (exception instanceof AxiosError && exception.response) {
      status = exception.response.status;
      message = exception.response.data.message || exception.message;
      code = mapHttpStatusToGqlCode(status);

      this.logger.error(`[AxiosError] ${status} - ${message}`);
    }

    // 기타 시스템 에러 (500)
    else {
      const errorStack = exception instanceof Error ? exception.stack : '';
      this.logger.error(`[Unknown Error] ${exception}`, errorStack);

      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message =
        '서버에서 알 수 없는 오류가 발생했습니다. 관리자에게 문의하세요.';
      code = 'INTERNAL_SERVER_ERROR';
    }

    // GraphQL 포맷
    throw new GraphQLError(message, {
      extensions: {
        code,
        httpStatus: status,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
