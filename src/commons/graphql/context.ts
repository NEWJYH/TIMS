import { Request, Response } from 'express';

export const createGqlContext = (req: Request, res: Response) => ({
  req,
  res,
});
