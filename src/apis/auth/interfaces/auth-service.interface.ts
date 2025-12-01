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

export interface IAuthServiceRestoreAccessToken {
  user: IAuthUser['user'];
}

export interface IAuthServiceLogout {
  context: IContext;
}

export interface IOAuthUser {
  user: Omit<User, 'id'>;
}

export interface IAuthServiceLoginOAuth {
  req: Request & IOAuthUser;
  res: Response;
}
