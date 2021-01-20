import { Router, Request, Response } from 'express';
import { Container } from 'typedi';
import auth from '../middlewares/auth'
import SharePointPublishService from '../../services/sharepoint'
import MongoPublishService from '../../services/mongo'
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


usersRouter.post('/:form', asyncMiddleware((req: Request, res: Response) => {
	if(req.body) {
		// console.log(req.body);
		if (!fs.existsSync('../../transforms/' + req.params.form)) {
		  // return res.status(400).json({error: 'No template found for: '+req.params.form});
		}
		let transform: any;
		if(process.env.NODE_ENV.toLowerCase().trim() !== 'production'){
			transform = require('../../transforms/' + req.params.form + '_'+ process.env.NODE_ENV.toLowerCase().trim() +'.ts').default;
		} else {
			transform = require('../../transforms/' + req.params.form + '.ts').default;
		}
		let outputs = transform.destinations.map(async (destination) => {
				logger.info(destination.Type);
				let results = {};
				try {
					if(destination.Type.toLowerCase() === 'sharepoint') {
						const spService = Container.get(SharePointPublishService);
						const result = await spService.process(destination, req.body);
						// console.log(result);
						results = { name: destination.Type.toLowerCase(), results : result};
						
					}
					
					if(destination.Type.toLowerCase() === 'mongo') {
						const mongService = Container.get(MongoPublishService);
						const result = await mongService.process(destination, req.body);
						results = { name: destination.Type.toLowerCase(), results : result};
					}
				} catch(e) {
					logger.error(e);
				} finally {
					// console.log(results);
					return new Promise((res, rej) => {res(results)});
				}
			});
		
		Promise.all(outputs).then((results) => {
			logger.debug(JSON.stringify(results));
			// let result = arr1.every(Boolean);
			console.log(JSON.stringify(results, null, 2));
			let resultBools = [];
			results.forEach((r) => {
				console.log(r);
				if(r['results'] && Array.isArray(r['results'])){
					r['results'].forEach((x) => {
						if(typeof x === "boolean") resultBools.push(x);
					});
				}
			});
			console.log(resultBools);
			let finalresult = resultBools.every(Boolean);
			return res.json({ status: finalresult, form: req.params.form}).status(200);
		});
		
	} else {
		return res.status(400).json({error: 'No data'});
	}
}));
  
usersRouter.post('/secure/:form', auth, asyncMiddleware((req: Request, res: Response) => {
	if (!fs.existsSync('../../transforms/' + req.params.form + '.js')) {
	  return res.status(400).json({error: 'No template found for: '+req.params.form});
	}
	const transform = require("../../transforms/" + req.params.form + ".js").default;
	
	return res.json({ status: 'ok', form: req.params.form}).status(200);
}));

export default usersRouter;
