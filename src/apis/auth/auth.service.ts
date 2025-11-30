import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/apis/users/users.service';
import {
  IAuthServiceGetAccessToken,
  IAuthServiceLogin,
  IAuthServiceLogout,
  IAuthServiceRestoreAccessToken,
  IAuthServiceSetRefreshToken,
} from './interfaces/auth-service.interface';
import * as bcrypt from 'bcrypt';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  //
  constructor(
    private readonly usersService: UsersService, //
    private readonly jwtService: JwtService,
  ) {}

  async login({
    email,
    password,
    context,
  }: IAuthServiceLogin): Promise<string> {
    // 1. 이메일이 일치하는 유저를 DB에서 찾기
    const user = await this.usersService.findOneByEmail({ email });

    // 2. 일치하는 유저가 없으면?! 에러 던지기!!!
    if (!user) throw new UnauthorizedException('이메일이 존재하지 않습니다.');

    // 3. 일치하는 유저가 있지만, 비밀번호가 틀렸다면?!
    const isAuth = await bcrypt.compare(password, user.password);
    if (!isAuth) throw new UnauthorizedException('비밀번호가 틀렸습니다.');

    // 4. refreshToken(=JWT)을 만들어서 브라우저 쿠키에 저장해서 보내주기
    this.setRefreshToken({ user, context });

    // 5. 일치하는 유저도 있고, 비밀번호도 맞았다면?!
    //    => accessToken(=JWT)을 만들어서 브라우저에 전달하기
    return this.getAccessToken({ user });
  }

  getAccessToken({ user }: IAuthServiceGetAccessToken): string {
    return this.jwtService.sign(
      {
        sub: user?.id, //
        role: user?.role.name,
      },
      {
        secret: process.env.JWT_ACCESS_TOKEN_SECRET, //
        expiresIn: process.env
          .JWT_ACCESS_TOKEN_EXPIRATION_TIME as JwtSignOptions['expiresIn'],
      },
    );
  }
  //       secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'), //
  //       expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),

  restoreAccessToken({ user }: IAuthServiceRestoreAccessToken): string {
    return this.getAccessToken({ user });
  }

  setRefreshToken({ user, context }: IAuthServiceSetRefreshToken): void {
    const refreshToken = this.jwtService.sign(
      {
        sub: user.id, //
        role: user.role?.name,
      },
      {
        secret: process.env.JWT_REFRESH_TOKEN_SECRET, //
        expiresIn: process.env
          .JWT_REFRESH_TOKEN_EXPIRATION_TIME as JwtSignOptions['expiresIn'],
      },
    );
    // 1. [FIX] 개발 환경 여부 체크 (로그아웃과 동일하게)
    const isProduction = process.env.NODE_ENV === 'production';

    // 2. [FIX] setHeader 대신 res.cookie() 헬퍼 함수 사용
    context.res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // 자바스크립트 접근 불가
      secure: isProduction, // 배포 시 HTTPS에서만
      sameSite: isProduction ? 'none' : 'lax', // 로컬 개발 시 'lax'
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 14, // 2주 (2w)를 밀리초로 변환
    });

    // // 개발환경
    // context.res.setHeader(
    //   'set-Cookie',
    //   `refreshToken=${refreshToken}; path=/;`,
    // );

    // TODO : 환경 변수에 따라 변하게 설정
    // 배포환경
    // context.res.setHeader('set-Cookie', `refreshToken=${refreshToken}; path=/; domain=.mybacksite.com; SameSite=None; Secure; httpOnly`);
    // context.res.setHeader('Access-Control-Allow-Origin', 'https://myfrontsite.com');
  }

  // 5. 로그아웃 (쿠키 삭제)
  logout({ context }: IAuthServiceLogout): string {
    // 배포 환경 여부 확인 (쿠키 옵션 맞추기 위함)
    const isProduction = process.env.NODE_ENV === 'production';

    // 쿠키의 내용을 비우고, 유효기간을 0으로 설정해서 즉시 만료시킴
    context.res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 0, // 0초 뒤 만료 = 즉시 삭제
    });

    return '로그아웃에 성공하였습니다.';
  }
}
