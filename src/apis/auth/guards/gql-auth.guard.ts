import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { IContext } from 'src/commons/interfaces/context';

// export class GqlAuthAccessGuard extends AuthGuard('access') {
//   getRequest(context: ExecutionContext) {
//     const gqlContext = GqlExecutionContext.create(context);
//     return gqlContext.getContext().req;
//   }
// }

// // 추가
// export class GqlAuthRefreshGuard extends AuthGuard('refresh') {
//   getRequest(context: ExecutionContext) {
//     const gqlContext = GqlExecutionContext.create(context);
//     return gqlContext.getContext().req;
//   }
// }

// 리팩토링
export const GqlAuthGuard = (name: string) =>
  class GqlAuthGuard extends AuthGuard(name) {
    getRequest(context: ExecutionContext) {
      const gqlContext = GqlExecutionContext.create(context);
      return gqlContext.getContext<IContext>().req;
    }
  };
