import { User } from 'src/apis/users/entities/user.entity';
import { IAuthUser, IContext } from 'src/commons/interfaces/context';
import { Request, Response } from 'express';

export interface IAuthServiceLogin {
  email: string;
  password: string;
  context: IContext;
}

export interface IAuthServiceGetAccessToken {
  user: User | IAuthUser['user'];
}
export interface IAuthServiceSetRefreshToken {
  user: User;
  context: IContext;
}

export interface IAuthServiceGetRefreshToken {
  user: User;
}

export interface IAuthServiceRestoreAccessToken {
  user: User;
  refreshToken: string;
  context: IContext;
}

export interface IAuthServiceLogout {
  context: IContext;
}

export interface IOAuthUser {
  user: Omit<User, 'id'>;
}

export interface IAuthServiceLoginOAuthWeb {
  req: Request & IOAuthUser;
  res: Response;
}

export interface IAuthServiceLoginOAuthApp {
  token: string;
  device: string;
  issuedIp: string;
}

export interface IAuthServiceGetRefreshToken {
  user: User;
}

export interface IAuthServiceRestoreTokenWeb {
  user: User;
  context: IContext;
}

export interface IAuthServiceRestoreTokenApp {
  refreshToken: string; // 클라이언트가 보낸 토큰
  device: string;
  issuedIp: string;
}
