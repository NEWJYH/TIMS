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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch(exception: unknown, _host: ArgumentsHost) {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '요청 처리 중 예기치 않은 오류가 발생했습니다.';
    let code = 'INTERNAL_SERVER_ERROR';

    // 스택 트레이스를 찍을지 여부
    let logStack = true;

    // NestJS HTTP 예외 처리 (400, 401, 403, 404, 409 ...)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        message = (response as any).message;
      } else if (typeof response === 'string') {
        message = response;
      } else {
        message = exception.message;
      }

      code = mapHttpStatusToGqlCode(status);

      // 400번대 에러는 WARN
      if (status >= 400 && status < 500) {
        logStack = false;
        this.logger.warn(`[HttpException] ${status} - ${message}`);
      } else {
        this.logger.error(`[HttpException] ${status} - ${message}`);
      }
    }
    // Axios 예외 처리
    else if (exception instanceof AxiosError && exception.response) {
      status = exception.response.status;
      const data = exception.response.data as any;
      message = data?.message || exception.message;
      code = mapHttpStatusToGqlCode(status);

      // 외부 API 에러
      this.logger.error(`[AxiosError] ${status} - ${message}`);
    }
    // 알 수 없는 시스템 에러 (500)
    else {
      const exAny = exception as any;
      const isClientError =
        exAny.status && exAny.status >= 400 && exAny.status < 500;

      if (isClientError) {
        // 라이브러리에서 발생한 400번대 에러
        logStack = false;
        status = exAny.status;
        message = exAny.message;
        code = mapHttpStatusToGqlCode(status);
        this.logger.warn(`[Client Error] ${status} - ${message}`);
      } else {
        // 500 에러 (DB 연결 끊김, Null Pointer 등)
        const errorStack = exception instanceof Error ? exception.stack : '';
        this.logger.error(`[Unknown Error] ${exception}`, errorStack);

        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message =
          '서버에서 알 수 없는 오류가 발생했습니다. 관리자에게 문의하세요.';
        code = 'INTERNAL_SERVER_ERROR';
      }
    }

    // GraphQL 포맷으로 던짐
    throw new GraphQLError(message, {
      extensions: {
        code,
        httpStatus: status,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
