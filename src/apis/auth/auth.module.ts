import { Module } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/apis/users/users.module';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.register({
      //
    }),
    UsersModule, //
  ],
  providers: [
    JwtAccessStrategy,
    JwtRefreshStrategy,
    AuthResolver, //
    AuthService,
  ],
})
export class AuthModule {}
