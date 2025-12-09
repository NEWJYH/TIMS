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
import { GqlArgumentsHost } from '@nestjs/graphql';
import { IContext } from '../interfaces/context';
import { Request, Response } from 'express';

// 응답 객체의 구조를 정의 (HttpException response)
interface IErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

// 알 수 없는 에러 객체가 status와 message를 가졌는지 확인하는 타입 가드
interface IClientError {
  status: number;
  message: string;
}

const isClientErrorObject = (err: unknown): err is IClientError => {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    'message' in err &&
    typeof (err as Record<string, unknown>).status === 'number' &&
    typeof (err as Record<string, unknown>).message === 'string'
  );
};

const mapHttpStatusToGqlCode = (status: number): string => {
  if (status >= 400 && status < 500) return 'BAD_USER_INPUT';
  if (status === 500) return 'INTERNAL_SERVER_ERROR';
  return `HTTP_${status}`;
};

@Catch()
export class CustomHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CustomHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // 유저 정보 추출
    let userLog = '';
    const contextType = host.getType();

    // REST-API
    if (contextType === 'http') {
      const ctx = host.switchToHttp();
      const req = ctx.getRequest<Request>();
      // req.user가 존재하고 id가 있는지 안전하게 확인
      const user = req.user as Record<string, any> | undefined;
      if (user && user.id) userLog = `[User: ${String(user.id)}]`;
    } // GRAPHQL-API
    else if ((contextType as string) === 'graphql') {
      const gqlHost = GqlArgumentsHost.create(host);
      const ctx = gqlHost.getContext<IContext>();
      // ctx.req.user 타입 안전하게 접근
      const user = ctx.req?.user as Record<string, any> | undefined;
      if (user && user.id) userLog = `[User: ${String(user.id)}]`;
    }

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '요청 처리 중 예기치 않은 오류가 발생했습니다.';
    let code = 'INTERNAL_SERVER_ERROR';

    // NestJS HTTP 예외
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      // 응답이 객체인지 문자열인지 확인하여 처리
      if (typeof response === 'object' && response !== null) {
        // IErrorResponse 인터페이스로 단언하여 접근
        const errorObj = response as IErrorResponse;
        if (Array.isArray(errorObj.message)) {
          message = errorObj.message.join(', ');
        } else if (typeof errorObj.message === 'string') {
          message = errorObj.message;
        }
      } else if (typeof response === 'string') {
        message = response;
      }

      code = mapHttpStatusToGqlCode(status);

      if (status >= 400 && status < 500) {
        this.logger.warn(`[HttpException] ${status} - ${message} - ${userLog}`);
      } else {
        this.logger.error(
          `[HttpException] ${status} - ${message} - ${userLog}`,
        );
      }
    }
    // Axios 예외
    else if (exception instanceof AxiosError && exception.response) {
      status = exception.response.status;
      // Axios 응답 데이터 타입을 명시 (unknown -> { message: string })
      const data = exception.response.data as { message?: string } | undefined;
      message = data?.message || exception.message;
      code = mapHttpStatusToGqlCode(status);

      this.logger.error(`[AxiosError] ${status} - ${message} - ${userLog}`);
    }
    // 기타 예외
    else {
      // isClientErrorObject 타입 가드
      if (
        isClientErrorObject(exception) &&
        exception.status >= 400 &&
        exception.status < 500
      ) {
        // 400번대 에러 (Client Error)
        status = exception.status;
        message = exception.message;
        code = mapHttpStatusToGqlCode(status);
        this.logger.warn(`[Client Error] ${status} - ${message} - ${userLog}`);
      } else {
        // 진짜 500 에러 (Unknown)
        const errorStack = exception instanceof Error ? exception.stack : '';
        // 템플릿 리터럴 내 unknown 타입 에러 해결 -> String() 변환
        const errorMsg =
          exception instanceof Error ? exception.message : String(exception);

        this.logger.error(
          `[Unknown Error] ${errorMsg} - ${userLog}`,
          errorStack,
        );

        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message =
          '서버에서 알 수 없는 오류가 발생했습니다. 관리자에게 문의하세요.';
        code = 'INTERNAL_SERVER_ERROR';
      }
    }

    if (host.getType() === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      // REST-API
      return response.status(status).json({
        statusCode: status,
        message: message,
        error: code,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
    // GraphQL
    throw new GraphQLError(message, {
      extensions: {
        code,
        httpStatus: status,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
