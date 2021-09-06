import express from 'express';
import modules from './modules/index.js';
import routes from './routes/index.js';

const app = express();

/** framework modules */

modules(app);
routes(app);
