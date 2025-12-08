import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from 'src/apis/users/users.service';
import { IPayload } from './jwt-strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(
    private readonly usersService: UsersService, //
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        const cookie = req.headers.cookie;
        if (!cookie) return null;

        //  쿠키가 여러 개일 때도 안전하게 파싱하는 로직
        const refreshToken = cookie
          .split('; ')
          .find((c) => c.startsWith('refreshToken='))
          ?.split('=')[1];

        return refreshToken || null;
      },
      secretOrKey: process.env.JWT_REFRESH_TOKEN_SECRET as string,
    });
  }

  async validate(payload: IPayload) {
    // console.log('Refresh Token Payload:', payload);

    // 리프레시 토큰이 있어도, 그 사이 유저가 탈퇴했으면 막아야 함
    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('접근 권한이 없습니다. (로그인 필요)');
    }

    // 최신 유저 정보를 리턴 (req.user에 담김)
    // 나중에 restoreAccessToken에서 이 정보를 사용함
    return user;
  }
}
