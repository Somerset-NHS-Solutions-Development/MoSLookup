import { Router, Request, Response } from 'express';

const usersRouter = Router();

usersRouter.get('/*', (request, response) => {
  return response.json("OK").status(200);
});

export default usersRouter;
