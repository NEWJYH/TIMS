import { Request, Response } from 'express';

export const createGqlContext = ({
  req,
  res,
}: {
  req: Request;
  res: Response;
}) => ({
  req,
  res,
});
