import { Router, Request, Response } from 'express';
import { Container } from 'typedi';

import auth from '../middlewares/auth'

import StaffRecordService from '../../services/staffrecord'

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


usersRouter.post('/', auth, asyncMiddleware((req: Request, res: Response) => {
	if(req.body && req.body.name && req.body.dob) {
		// console.dir(req.body);
		const mosService = Container.get(StaffRecordService);
		mosService.getStaffMemberSearch(req.body.name,req.body.dob).then((result) => {
			return res.json({ status: 'ok', result: result}).status(200);		
		}).catch(err => { return res.status(500).json({error: err.message})});;
	} else {
		return res.status(400).json({error: 'Search parameters missing'});
	}
}));

export default usersRouter;