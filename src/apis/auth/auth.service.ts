import {
  IAuthServiceGetAccessToken,
  IAuthServiceGetRefreshToken,
  IAuthServiceLogin,
  IAuthServiceLoginOAuthApp,
  IAuthServiceLoginOAuthWeb,
  IAuthServiceLogout,
  IAuthServiceRestoreAccessToken,
  IAuthServiceSetRefreshToken,
  IJwtPayload,
} from './interfaces/auth-service.interface';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/apis/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { IContext } from 'src/commons/interfaces/context';
import { OAuth2Client } from 'google-auth-library';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refreshToken.entity';
import { Repository } from 'typeorm';
import { ValkeyCacheService } from 'src/commons/core/services/valkey-cache.service';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshRepository: Repository<RefreshToken>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly valkeyCacheService: ValkeyCacheService, //
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID_APP);
  }

  private getExpiresInMs(): number {
    return 1000 * 60 * 60 * 24 * 14;
  }

  private async saveRefreshToken({
    refreshToken,
    userId,
    device,
    issuedIp,
  }: {
    refreshToken: string;
    userId: string;
    device: string;
    issuedIp: string;
  }): Promise<void> {
    const salt = await bcrypt.genSalt(Number(process.env.JWT_SALT));
    const tokenHash = await bcrypt.hash(refreshToken, salt);
    const payload: { exp: number } = this.jwtService.decode(refreshToken);
    if (!payload || !payload.exp) {
      throw new ConflictException('토큰 페이로드를 읽을 수 없습니다.');
    }
    const expiresAt = new Date(payload.exp * 1000);

    const result = await this.refreshRepository.save({
      tokenHash: tokenHash,
      expiresAt: expiresAt,
      device,
      userId,
      isRevoked: false,
      issuedIp,
    });

    if (!result)
      throw new ConflictException('리프레시 토큰 저장에 실패했습니다.');
    // 토큰 정리 로직 (5개 이상일 경우 오래된 순 삭제)
    await this.cleanupOldTokens(userId);
  }

  // OAuth Web Login Controller
  async loginGoogleOAuthWeb({ req, res }: IAuthServiceLoginOAuthWeb) {
    const email = req.user.email;

    const user = await this.usersService.createOAuthUser({ email });

    await this.setRefreshToken({
      user,
      context: { req: req as IContext['req'], res },
    });

    const accessToken = this.getAccessToken({ user });
    const frontDomain = process.env.FRONT_DOMAIN;
    res.redirect(`${frontDomain}?accessToken=${accessToken}`);
  }

  // OAuth App Login Resolver
  async loginGoogleOAuthApp({
    token,
    device,
    issuedIp,
  }: IAuthServiceLoginOAuthApp) {
    let email: string;

    // 1. Google 토큰 검증
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID_APP as string,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email)
        throw new Error('토큰 페이로드가 유효하지 않습니다.');
      email = payload.email;
    } catch (error) {
      console.error('Google 토큰 검증 오류:', error);
      throw new UnauthorizedException('유효하지 않은 Google 인증 토큰입니다.');
    }

    // 2. 사용자 처리
    const user = await this.usersService.createOAuthUser({ email });

    // 3. 토큰 생성
    const accessToken = this.getAccessToken({ user });
    const refreshToken = this.getRefreshToken({ user });
    // 4. DB 저장
    await this.saveRefreshToken({
      refreshToken,
      userId: user.id,
      device,
      issuedIp,
    });

    // 5. 결과 반환
    return {
      accessToken,
      refreshToken,
    };
  }

  // 일반 Login
  async login({
    email,
    password,
    context,
  }: IAuthServiceLogin): Promise<string> {
    const user = await this.usersService.findOneByEmail({ email });
    if (!user)
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 잘못 되었습니다.',
      );
    if (!user.password)
      throw new UnauthorizedException(
        '소셜 로그인(구글 등)으로 가입된 계정입니다.',
      );

    const isAuth = await bcrypt.compare(password, user.password);
    if (!isAuth)
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 잘못 되었습니다.',
      );

    await this.setRefreshToken({ user, context });

    return this.getAccessToken({ user });
  }

  getAccessToken({ user }: IAuthServiceGetAccessToken): string {
    return this.jwtService.sign(
      { sub: user?.id, role: user?.role.name },
      {
        secret: process.env.JWT_ACCESS_TOKEN_SECRET,
        expiresIn: process.env
          .JWT_ACCESS_TOKEN_EXPIRATION_TIME as JwtSignOptions['expiresIn'],
      },
    );
  }

  getRefreshToken({ user }: IAuthServiceGetRefreshToken): string {
    return this.jwtService.sign(
      { sub: user.id, role: user.role?.name },
      {
        secret: process.env.JWT_REFRESH_TOKEN_SECRET,
        expiresIn: process.env
          .JWT_REFRESH_TOKEN_EXPIRATION_TIME as JwtSignOptions['expiresIn'],
      },
    );
  }

  async logout({
    context,
    refreshTokenForApp,
  }: IAuthServiceLogout & { refreshTokenForApp?: string }): Promise<string> {
    const req = context.req;
    const res = context.res;
    const user = req.user;

    const refreshToken =
      refreshTokenForApp || (req.cookies['refreshToken'] as string | undefined);
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh Token이 없습니다.');
    }

    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      if (accessToken) {
        // 토큰의 만료시간(exp)을 확인해서 남은 시간(TTL) 계산
        const decoded: IJwtPayload = this.jwtService.decode(accessToken);
        if (decoded && decoded['exp']) {
          const ttl = decoded['exp'] - Math.floor(Date.now() / 1000);

          if (ttl > 0) {
            // 남은 시간만큼만 Valkey에 "차단" 등록
            await this.valkeyCacheService.set<string>(
              `block:token:${accessToken}`,
              'logout',
              ttl,
            );
          }
        }
      }
    } catch (e) {
      console.error('Access Token 블랙리스트 등록 실패 (로그아웃은 진행)', e);
    }
    if (user) {
      try {
        const activeUserTokens = await this.refreshRepository.find({
          where: { userId: user.id, isRevoked: false },
        });

        const matchedToken = await this.findMatchingToken(
          refreshToken,
          activeUserTokens,
        );

        if (matchedToken) {
          await this.refreshRepository.update(
            { id: matchedToken.id },
            { isRevoked: true },
          );
        }
      } catch (e) {
        console.error('DB 토큰 폐기 실패:', e);
      }
    }

    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('refreshToken', {
      path: '/',
      httpOnly: true,
      secure: false, // TODO : 변경해야함 isProduction
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 0,
    });

    return '로그아웃에 성공하였습니다.';
  }

  // web - rotate refresh
  async restoreAccessToken({
    user,
    refreshToken,
    context,
  }: IAuthServiceRestoreAccessToken) {
    // 1. 요청받은 토큰과 일치하는 DB 데이터 찾기
    // (DB에는 해시되어 저장되어 있으므로, user의 모든 토큰을 가져와 비교해야 함)
    const allUserTokens = await this.refreshRepository.find({
      where: { userId: user.id },
    });

    const matchedToken = await this.findMatchingToken(
      refreshToken,
      allUserTokens,
    );

    // 만약 DB에서 찾을 수 없거나 이미 취소된(Revoked) 토큰이라면 의심스러운 접근
    if (!matchedToken) {
      throw new UnauthorizedException('존재하지 않는 토큰입니다.');
    }
    if (matchedToken.isRevoked) {
      throw new UnauthorizedException(
        '이미 폐기된 토큰입니다. 다시 로그인해주세요.',
      );
    }

    // 2. 기존 리프레시 토큰 폐기 (isRevoked = true)
    await this.refreshRepository.update(
      { id: matchedToken.id },
      { isRevoked: true },
    );

    // 3. 리프레시 토큰 재발급 로직 실행 (Rotation)
    await this.setRefreshToken({ user, context });

    // 4. 새 Access Token 발급 및 반환
    return this.getAccessToken({ user });
  }

  // app - none rotate refresh
  async restoreAccessTokenApp({ refreshToken }: { refreshToken: string }) {
    // 1. JWT 자체의 유효성 검사
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_TOKEN_SECRET as string,
      });
    } catch {
      // 만료되었거나 시그니처가 안 맞으면 에러
      throw new UnauthorizedException('유효하지 않거나 만료된 토큰입니다.');
    }

    // 2. 유저 존재 여부 확인
    const userId = payload.sub;
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('존재하지 않는 사용자입니다.');
    }

    // 3. DB에 저장된 토큰인지, 취소(Revoked)된 토큰인지 확인
    const allUserTokens = await this.refreshRepository.find({
      where: { userId: user.id },
    });

    const matchedToken = await this.findMatchingToken(
      refreshToken,
      allUserTokens,
    );

    // DB에 없거나, 이미 취소된 토큰이면 차단
    if (!matchedToken) {
      throw new UnauthorizedException(
        '인증 정보가 만료되었습니다. 다시 로그인해주세요.',
      );
    }
    if (matchedToken.isRevoked) {
      throw new UnauthorizedException('이미 폐기된 토큰입니다. 해킹 의심.');
    }

    // 4. 새로운 Access Token 발급
    const newAccessToken = this.getAccessToken({ user });

    return { accessToken: newAccessToken };
  }

  // web-set Refresh-token
  async setRefreshToken({
    user,
    context,
  }: IAuthServiceSetRefreshToken): Promise<void> {
    // 1. 토큰 생성
    const refreshToken = this.getRefreshToken({ user });

    // 2. DB 저장
    await this.saveRefreshToken({
      refreshToken,
      userId: user.id,
      device: context.req.headers['user-agent'] || 'Unknown Web', // 기기 정보
      issuedIp: context.req.ip!, // IP 정보
    });

    // 3. HTTP Only 쿠키 설정
    const isProduction = process.env.NODE_ENV === 'production';
    const expiresInMs = this.getExpiresInMs();

    context.res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, //TODO : isProduction
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: expiresInMs,
    });
  }

  private async findMatchingToken(
    rawToken: string,
    tokens: RefreshToken[],
  ): Promise<RefreshToken | undefined> {
    for (const token of tokens) {
      const isMatch = await bcrypt.compare(rawToken, token.tokenHash);
      if (isMatch) return token;
    }
    return undefined;
  }

  private async cleanupOldTokens(userId: string) {
    // 1. 해당 유저의 전체 토큰 개수 확인
    const count = await this.refreshRepository.count({
      where: { userId },
    });

    // 2. 5개 이상이면 정리 시작
    if (count > 5) {
      const limit = count - 5; // 삭제해야 할 개수 (최소 유지 개수 5개)

      const tokensToDelete = await this.refreshRepository.find({
        where: { userId },
        order: { expiresAt: 'ASC', createdAt: 'ASC' },
        take: limit,
      });

      // 삭제 실행
      if (tokensToDelete.length > 0) {
        await this.refreshRepository.remove(tokensToDelete);
      }
    }
  }
}
