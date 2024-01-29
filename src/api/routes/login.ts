import { Router, Request, Response, NextFunction } from 'express';
import https from 'https';

const route = Router();


export default (app: Router) => {
	//app.use('/login', route);
	route.post('/*', (req, res) => {

		const user = req.body;
		const username = user.username;
		const password = user.password;
		const options = {
			method: 'POST',
			url: (process.env.openIDDirectAccessEnpoint),
			headers: { 'content-type': 'application/x-www-form-urlencoded' }
			
		};

		const form = {
			username, 
			password, 
			client_id: (process.env.openIDClientID),
			grant_type: 'password',
			client_secret: (process.env.openIDClientSecret)
		}

		// request(options, (error, response, body) => {
		// 	if (error) throw new Error(error);

		// 	const json = (JSON.parse(body));		
		// 	res.status(200).json(json);

		// });

		const reqs = https.request(process.env.openIDDirectAccessEnpoint, options, (ress) => {
			ress.setEncoding('utf8');
			let data = '';
			ress.on('data', (chunk) => {
				data += chunk;
			});
			ress.on('end', () => {
				const json = (JSON.parse(data));		
				res.status(200).json(json);
			});
		});
	
		reqs.write(JSON.stringify(form));
	
		reqs.end();

	})
  
};
