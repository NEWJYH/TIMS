import { User } from 'src/apis/users/entities/user.entity';
import { Request, Response } from 'express';

export interface IAuthUser {
  user?: User;
}

export interface IContext {
  req: Request & IAuthUser;
  res: Response;
}
