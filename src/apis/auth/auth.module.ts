import { Module } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/apis/users/users.module';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    JwtModule.register({}),
    UsersModule, //
  ],
  providers: [
    GoogleStrategy,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    AuthResolver, //
    AuthService,
  ],
  controllers: [
    AuthController, //
  ],
})
export class AuthModule {}
