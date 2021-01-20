import { Router, Request, Response, NextFunction } from 'express';

const route = Router();
const request = require("request");

export default (app: Router) => {
	//app.use('/login', route);
	route.post('/*', (req, res) => {

		const user = req.body;
		const username = user.username;
		const password = user.password;
		const options = {
			method: 'POST',
			url: (process.env.openIDDirectAccessEnpoint),
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			form: {
				username, 
				password, 
				client_id: (process.env.openIDClientID),
				grant_type: 'password',
				client_secret: (process.env.openIDClientSecret)
			}
		};

		request(options, (error, response, body) => {
			if (error) throw new Error(error);

			const json = (JSON.parse(body));		
			res.status(200).json(json);

		});

	})
  
};
