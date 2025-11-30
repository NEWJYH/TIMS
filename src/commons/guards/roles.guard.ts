import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '../decorators/roles.decorator';

import { RoleName } from '../enums/role.enum';
import { IContext } from '../interfaces/context';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 리졸버에 붙은 @Roles('ADMIN') 같은 메타데이터를 가져옴
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 권한 설정이 없으면 통과
    if (!requiredRoles) {
      return true;
    }

    // GraphQL Context에서 User 정보 꺼냄 (GqlAuthGuard가 넣어둠)
    const gqlContext = GqlExecutionContext.create(context);
    const ctx = gqlContext.getContext<IContext>();
    const request = ctx.req;
    const user = request.user;

    // 로그인이 안 되어 있으면 차단
    if (!user) {
      return false;
    }

    // 내 권한이 허용된 목록에 있는지 확인
    // user.role이 relations로 잘 로딩되어 있어야 함! (Strategy 확인)
    const userRoleName = user.role.name as RoleName;

    return requiredRoles.some((role) => role === userRoleName);
  }
}
