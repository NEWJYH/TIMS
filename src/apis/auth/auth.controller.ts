import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { IOAuthUser } from './interfaces/auth-service.interface';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/login/google')
  @UseGuards(AuthGuard('google'))
  async loginGoogleWeb(
    @Req() req: Request & IOAuthUser, //
    @Res() res: Response,
  ) {
    return await this.authService.loginGoogleOAuthWeb({ req, res });
  }
}
