import { Router } from 'express';
import login from './routes/login';
import status from './routes/status';
import formPost from './routes/formPost';
import search from './routes/search';
import mos from './routes/mos';

// guaranteed to get dependencies

const routes = Router();
routes.use('/status', status);
routes.use('/login', login);
routes.use('/search', search);
routes.use('/mos', mos);


export default routes;