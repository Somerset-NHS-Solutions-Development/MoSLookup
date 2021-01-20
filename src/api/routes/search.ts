import { Router, Request, Response } from 'express';
import { Container } from 'typedi';
import auth from '../middlewares/auth'
// import SharePointPublishService from '../../services/sharepoint'
// import MongoPublishService from '../../services/mongo'
import logger from '../../loaders/logger'
import config from '../../config';

const usersRouter = Router();

const fs = require('fs');
const path = require('path');

const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
        .catch(next);
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
} 


usersRouter.post('/', asyncMiddleware((req: Request, res: Response) => {
	if(req.body) {
		return res.json({ status: 'ok', result: [{}]}).status(200);		
	} else {
		return res.status(400).json({error: 'No data'});
	}
}));

export default usersRouter;