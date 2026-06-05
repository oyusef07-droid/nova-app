import { handle } from 'hono/vercel';
import app from '../__create/index';

export default handle(app);
