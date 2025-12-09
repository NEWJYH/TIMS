import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/apis/users/users.service';
import { IPayload } from './jwt-strategy';
import { Request } from 'express';
import { ValkeyCacheService } from 'src/commons/core/services/valkey-cache.service';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'access') {
  constructor(
    private readonly usersService: UsersService, //
    private readonly valkeyCacheService: ValkeyCacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET as string,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: IPayload) {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    // 여기 들어와서 accessToken valkey가 검사안함
    if (accessToken) {
      const isBlacklisted = await this.valkeyCacheService.get(
        `block:token:${accessToken}`,
      );

      if (isBlacklisted) {
        throw new UnauthorizedException();
      }
    }

    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
