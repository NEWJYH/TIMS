import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IContext } from '../interfaces/context';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    // JwtStrategy에서 req.user에 저장한 객체를 리턴
    return ctx.getContext<IContext>().req.user;
  },
);
