import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/apis/users/users.service';
import { IPayload } from './jwt-strategy';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'access') {
  constructor(
    private readonly usersService: UsersService, //
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET as string,
    });
  }

  async validate(payload: IPayload) {
    // console.log('payload sub: ', payload.sub);

    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('접근 권한이 없습니다.');
    }

    // console.log('DB User Role:', user.role);
    // User Entity 자체를 리턴 (req.user가 됨)
    return user;
  }
}
