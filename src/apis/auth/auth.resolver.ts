import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { IContext } from 'src/commons/interfaces/context';
import { AuthService } from './auth.service';
import { LoginResponse } from './dto/login-response.dto';
import { GoogleLoginInput } from './dto/google-login.dto';
import { RestoreAccessTokenAppResponse } from './dto/restore-access-token-app-response.dto';

@Resolver()
export class AuthResolver {
  //
  constructor(
    private readonly authService: AuthService, //
  ) {}
  //
  // TODO : 쿠키 파서 적용
  // TODO : DTO, interface 분리
  // TODO : 모듈 전체 리펙토링
  // 구글 앱 로그인 (플러터-android, ios)
  @Mutation(() => LoginResponse)
  loginGoogleApp(
    @Args('googleLoginInput') googleLoginInput: GoogleLoginInput, //
  ): Promise<LoginResponse> {
    return this.authService.loginGoogleOAuthApp(googleLoginInput);
  }

  // 일반 web 로그인 (웹방식 로그인)
  @Mutation(() => String)
  login(
    @Args('email') email: string, //
    @Args('password') password: string,
    @Context() context: IContext,
  ): Promise<string> {
    return this.authService.login({ email, password, context });
  }
  // web rotate refreshToken
  @UseGuards(GqlAuthGuard('refresh'))
  @Mutation(() => String)
  restoreAcessToken(
    @Context() context: IContext, //
  ) {
    const cookie = context.req.headers.cookie;
    if (!cookie) throw new UnauthorizedException('쿠키가 없습니다.');
    const refreshToken = cookie
      .split('; ')
      .find((c) => c.startsWith('refreshToken='))
      ?.split('=')[1];

    if (!refreshToken)
      throw new UnauthorizedException('Refresh Token이 없습니다.');

    return this.authService.restoreAccessToken({
      user: context.req.user!,
      refreshToken,
      context,
    });
  }

  // App refresh accessToken
  @Mutation(() => RestoreAccessTokenAppResponse)
  restoreAccessTokenApp(
    @Args('refreshToken') refreshToken: string,
  ): Promise<RestoreAccessTokenAppResponse> {
    return this.authService.restoreAccessTokenApp({ refreshToken });
  }

  @UseGuards(GqlAuthGuard('access'))
  @Mutation(() => String)
  logout(
    @Context() context: IContext, //
    @Args('refreshToken', { nullable: true }) refreshToken?: string,
  ): Promise<string> {
    return this.authService.logout({
      context,
      refreshTokenForApp: refreshToken,
    });
  }
}
