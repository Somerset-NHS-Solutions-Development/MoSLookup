import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

import audit from '../../loaders/auditlogger';
import logger from '../../loaders/logger'
import config from '../../config';


// const jwt = require('jsonwebtoken');
// Verify using getKey callback
// Uses https://github.com/auth0/node-jwks-rsa as a way to fetch the keys.
// const jwksClient = require('jwks-rsa');


const apiKeys = config.xAPI.apiKeys;

async function getSigningKey(token) {	
	return new Promise((resolve, reject) => {
		const client = jwksClient({
			strictSsl: true, // Default value			
			jwksUri: (process.env.jwksUri)
		});
		const decoded = jwt.decode(token, {complete: true});
		client.getSigningKey(decoded.header.kid, (err, key) => {
			if(err) {
				logger.error(err);
				reject(err);
			} else {
				const signingKey = key.getPublicKey() // || key.rsaPublicKey;
				resolve(signingKey);
			}
		});
	});
}


const auth = async (req, res, next) => {
    try {
		if(!req.headers.authorization && !req.headers['x-api-key'] ) {
			throw new Error("No authorization headers found");		
		}
		if(req.headers.authorization){
			logger.debug(`Authorization Header found : ${req.headers.authorization}`);
			const token = req.headers.authorization.split(' ')[1];
			if(token.length < 10) {
				throw new Error(`Invalid token length: ${req.headers.authorization}`);
			}
			const signingKey = await getSigningKey(token);
			const options = { ignoreExpiration: false, maxAge : '15m', algorithms: ['RS256'] };
			const claimPath = process.env.AccessClaimPath;
			jwt.verify(token, signingKey, options, (err, vdecoded) => {
					if(err){
						throw new Error('Unable to verify token');
					}
					req.userData = vdecoded;
					req.userAccess = vdecoded[claimPath];
					
					// Check Roles at least one role is present 
					let found = 0;
					if((process.env.AccessRolesAllowed).includes(',')) {
						
						(process.env.AccessRolesAllowed).split(',').forEach((item) => {
							if(req.userAccess.indexOf(item.trim()) !== -1){
								found = 1;
							}
						});
					} else if(req.userAccess.indexOf(process.env.AccessRolesAllowed.trim()) !== -1){
								found = 1;
						}
					if(found === 0) {
						throw new Error(`Roles not found: ${JSON.stringify(vdecoded)}`);
					}
					
					audit.info(`Audit Success: ${JSON.stringify(vdecoded)}`);
				});
			next();
		} 		
		
		if(req.headers['x-api-key'] && process.env.xAPIKeyEnabled.toLowerCase() === 'true') {
			logger.info(JSON.stringify(apiKeys));
			const apiKey = req.headers['x-api-key'].trim();
			if(apiKey.length == 36 && apiKeys.indexOf(apiKey) > -1){
				audit.info(`Audit Success: X-API-KEY ${apiKey}`);
				next();
				return;
			} else {
				throw new Error(`API Key not valid ${apiKey}`);
			}
		}
		
        
    } catch (err) {
		audit.error(`Audit Failure: ${err}`);
		logger.error(err);
        res.status(401).json({
			message: "Authorisation failed."
		});
		res.end();
    }
}

export default auth;
